import "reflect-metadata";
import "server-only";

import fs from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

import Database from "better-sqlite3";
import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";
import { BallInventoryMovementEntity } from "@/lib/db/entities/ball-inventory-movement.entity";
import { CondominiumCourtEntity } from "@/lib/db/entities/condominium-court.entity";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import { CondominiumPaymentEntity } from "@/lib/db/entities/condominium-payment.entity";
import { AdminSessionEntity } from "@/lib/db/entities/admin-session.entity";
import { TubeBrandEntity } from "@/lib/db/entities/tube-brand.entity";
import { seedDatabase } from "@/lib/db/seed";
import { getTubeStockEntries } from "@/lib/domain/tube-stock";
import { DataSource, type DataSourceOptions } from "typeorm";

declare global {
  var __serverboxDataSourceCache:
    | {
        version: string;
        promise: Promise<DataSource>;
      }
    | undefined;
}

const DATA_SOURCE_SCHEMA_VERSION = "2026-06-10-brand-stock";

const entities = [
  AdministratorEntity,
  TubeBrandEntity,
  CondominiumEntity,
  CondominiumCourtEntity,
  CondominiumPaymentEntity,
  BallInventoryMovementEntity,
  AdminSessionEntity,
];

type OrmConfig = {
  type?: "postgres" | "better-sqlite3";
  url?: string;
  database?: string;
  synchronize?: boolean;
  ssl?: {
    rejectUnauthorized?: boolean;
  };
};

function getOrmConfig() {
  const ormconfigPath = path.resolve(process.cwd(), "ormconfig.json");

  if (!fs.existsSync(ormconfigPath)) {
    return {} satisfies OrmConfig;
  }

  try {
    return JSON.parse(fs.readFileSync(ormconfigPath, "utf8")) as OrmConfig;
  } catch (error) {
    console.error("Failed to parse ormconfig.json", error);
    return {} satisfies OrmConfig;
  }
}

const ormConfig = getOrmConfig();

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.SUPABASE_DATABASE_URL?.trim() ||
    ormConfig.url?.trim()
  );
}

// Prefer sqlite during local development unless explicitly forced to use
// Postgres. This avoids accidentally using a production Postgres URL placed
// in `.env.local` and triggering concurrent Postgres queries during dev.
function resolveDatabaseUrlForEnvironment() {
  const url = getDatabaseUrl();

  if (!url) return undefined;

  const isDev = process.env.NODE_ENV !== "production" && !isVercelRuntime();

  if (isDev && process.env.FORCE_POSTGRES !== "true") {
    return undefined;
  }

  return url;
}

function isVercelRuntime() {
  return process.env.VERCEL === "1";
}

function isProductionBuild() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function getDatabasePath() {
  const baseDirectory = isVercelRuntime()
    ? path.join("/tmp", "serverbox")
    : path.join(process.cwd(), "data");

  return path.join(
    baseDirectory,
    ormConfig.database ?? process.env.DB_FILENAME ?? "serverbox.sqlite",
  );
}

async function resetLegacyDatabaseIfNeeded(databasePath: string) {
  let database: Database.Database | null = null;

  try {
    database = new Database(databasePath, { fileMustExist: true });
    const tableInfo = database
      .prepare("PRAGMA table_info('condominiums')")
      .all() as Array<{ name: string }>;
    const hasLegacySubscriptionsTable = Boolean(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'subscriptions'",
        )
        .get(),
    );
    const hasLegacyPlanTable = Boolean(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'plans'",
        )
        .get(),
    );
    const hasPaymentTable = Boolean(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'condominium_payments'",
        )
        .get(),
    );
    const hasInventoryTable = Boolean(
      database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ball_inventory_movements'",
        )
        .get(),
    );
    const hasPrimaryAdminId = tableInfo.some(
      (column) => column.name === "primaryAdminId",
    );
    const paymentTableInfo = hasPaymentTable
      ? (database
          .prepare("PRAGMA table_info('condominium_payments')")
          .all() as Array<{ name: string }>)
      : [];
    const hasPixTransactionId = paymentTableInfo.some(
      (column) => column.name === "pixTransactionId",
    );
    const hasPixQrCode = paymentTableInfo.some(
      (column) => column.name === "pixQrCode",
    );
    const hasPixCopyPasteCode = paymentTableInfo.some(
      (column) => column.name === "pixCopyPasteCode",
    );
    const hasPixExpiresAt = paymentTableInfo.some(
      (column) => column.name === "pixExpiresAt",
    );
    const hasVerifiedAt = paymentTableInfo.some(
      (column) => column.name === "verifiedAt",
    );
    const hasVerificationSource = paymentTableInfo.some(
      (column) => column.name === "verificationSource",
    );
    const hasPlansColumnOnCondominiums = tableInfo.some(
      (column) => column.name === "plans",
    );
    const hasPlanId = paymentTableInfo.some((column) => column.name === "planId");
    const hasPlanName = paymentTableInfo.some((column) => column.name === "planName");

    database.close();
    database = null;

    if (
      hasLegacySubscriptionsTable ||
      hasLegacyPlanTable ||
      !hasPrimaryAdminId ||
      !hasPlansColumnOnCondominiums ||
      !hasPaymentTable ||
      !hasInventoryTable ||
      !hasPlanId ||
      !hasPlanName ||
      !hasPixTransactionId ||
      !hasPixQrCode ||
      !hasPixCopyPasteCode ||
      !hasPixExpiresAt ||
      !hasVerifiedAt ||
      !hasVerificationSource
    ) {
      await rm(databasePath, { force: true });
      await rm(`${databasePath}-journal`, { force: true });
    }
  } catch {
    if (database) {
      database.close();
    }
  }
}

function createDataSourceOptions(): DataSourceOptions {
  const databaseUrl = resolveDatabaseUrlForEnvironment();

  if (databaseUrl) {
    // For safety, only enable TypeORM `synchronize` for Postgres when an
    // explicit environment flag is set. This avoids TypeORM running
    // parallel schema-sync queries during app startup which can trigger
    // pg's deprecation warning when the DB client is reused concurrently.
    const allowSynchronize = process.env.TYPEORM_ALLOW_SYNCHRONIZE === "true";

    return {
      type: "postgres",
      url: databaseUrl,
      ssl: ormConfig.ssl ?? {
        rejectUnauthorized: false,
      },
      uuidExtension: "pgcrypto",
      synchronize: allowSynchronize && Boolean(ormConfig.synchronize),
      entities,
    };
  }

  return {
    type: "better-sqlite3",
    database: databaseUrl ?? getDatabasePath(),
    synchronize: ormConfig.synchronize ?? true,
    entities,
  };
}

async function ensurePostgresRuntimeSchema(dataSource: DataSource) {
  if (dataSource.options.type !== "postgres") {
    return;
  }

  await dataSource.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS tube_brands (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name character varying NOT NULL UNIQUE,
      "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp without time zone NOT NULL DEFAULT now()
    )
  `);
  await dataSource.query(`
    ALTER TABLE condominiums
    ADD COLUMN IF NOT EXISTS "tubeStockByBrand" text NOT NULL DEFAULT '[]'
  `);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS condominium_courts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name character varying NOT NULL,
      "sortOrder" integer NOT NULL DEFAULT 0,
      "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
      "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
      "condominiumId" uuid NOT NULL,
      "tubeBrandId" uuid NOT NULL,
      CONSTRAINT "FK_condominium_courts_condominium"
        FOREIGN KEY ("condominiumId")
        REFERENCES condominiums(id)
        ON DELETE CASCADE,
      CONSTRAINT "FK_condominium_courts_tube_brand"
        FOREIGN KEY ("tubeBrandId")
        REFERENCES tube_brands(id)
        ON DELETE RESTRICT
    )
  `);
  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS "IDX_condominium_courts_condominium"
      ON condominium_courts ("condominiumId")
  `);
  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS "IDX_condominium_courts_tube_brand"
      ON condominium_courts ("tubeBrandId")
  `);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS condominium_court_tube_brands (
      "courtId" uuid NOT NULL,
      "tubeBrandId" uuid NOT NULL,
      CONSTRAINT "PK_condominium_court_tube_brands"
        PRIMARY KEY ("courtId", "tubeBrandId"),
      CONSTRAINT "FK_condominium_court_tube_brands_court"
        FOREIGN KEY ("courtId")
        REFERENCES condominium_courts(id)
        ON DELETE CASCADE,
      CONSTRAINT "FK_condominium_court_tube_brands_tube_brand"
        FOREIGN KEY ("tubeBrandId")
        REFERENCES tube_brands(id)
        ON DELETE RESTRICT
    )
  `);
  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS "IDX_condominium_court_tube_brands_court"
      ON condominium_court_tube_brands ("courtId")
  `);
  await dataSource.query(`
    CREATE INDEX IF NOT EXISTS "IDX_condominium_court_tube_brands_tube_brand"
      ON condominium_court_tube_brands ("tubeBrandId")
  `);
  await dataSource.query(`
    INSERT INTO condominium_court_tube_brands ("courtId", "tubeBrandId")
    SELECT id, "tubeBrandId"
    FROM condominium_courts
    WHERE "tubeBrandId" IS NOT NULL
    ON CONFLICT DO NOTHING
  `);
}

async function backfillCourtTubeBrands(dataSource: DataSource) {
  if (dataSource.options.type === "postgres") {
    await dataSource.query(`
      INSERT INTO condominium_court_tube_brands ("courtId", "tubeBrandId")
      SELECT id, "tubeBrandId"
      FROM condominium_courts
      WHERE "tubeBrandId" IS NOT NULL
      ON CONFLICT DO NOTHING
    `);
    return;
  }

  await dataSource.query(`
    INSERT OR IGNORE INTO condominium_court_tube_brands ("courtId", "tubeBrandId")
    SELECT id, "tubeBrandId"
    FROM condominium_courts
    WHERE "tubeBrandId" IS NOT NULL
  `);
}

async function backfillCondominiumTubeStock(dataSource: DataSource) {
  const condominiumRepository = dataSource.getRepository(CondominiumEntity);
  const brandRepository = dataSource.getRepository(TubeBrandEntity);
  const condominiums = await condominiumRepository.find({
    relations: {
      courtDetails: {
        tubeBrand: true,
      },
    },
  });
  const defaultBrand = await brandRepository.findOne({
    where: {},
    order: {
      name: "ASC",
    },
  });

  for (const condominium of condominiums) {
    if (
      getTubeStockEntries(condominium.tubeStockByBrand).length > 0 ||
      !Number.isFinite(condominium.ballQuantity) ||
      condominium.ballQuantity <= 0
    ) {
      continue;
    }

    const sortedCourts = [...(condominium.courtDetails ?? [])].sort(
      (left, right) => left.sortOrder - right.sortOrder,
    );
    const tubeBrand = sortedCourts[0]?.tubeBrand ?? defaultBrand;

    if (!tubeBrand) {
      continue;
    }

    condominium.tubeStockByBrand = [
      {
        tubeBrandId: tubeBrand.id,
        quantity: condominium.ballQuantity,
      },
    ];

    await condominiumRepository.save(condominium);
  }
}

async function createDataSource() {
  const databaseUrl = resolveDatabaseUrlForEnvironment();

  if (!databaseUrl) {
    if (isVercelRuntime() && !isProductionBuild()) {
      throw new Error(
        "DATABASE_URL nao configurada para o ambiente de producao. Configure a URL do Supabase para que o schema seja criado no banco correto.",
      );
    }

    const databasePath = getDatabasePath();
    await mkdir(path.dirname(databasePath), { recursive: true });
    await resetLegacyDatabaseIfNeeded(databasePath);
  }

  const initialize = async () => {
    const dataSource = new DataSource(createDataSourceOptions());

    await dataSource.initialize();
    await ensurePostgresRuntimeSchema(dataSource);
    await backfillCourtTubeBrands(dataSource);
    await backfillCondominiumTubeStock(dataSource);
    await seedDatabase(dataSource);

    return dataSource;
  };

  return initialize();
}

export async function getDataSource() {
  const cached = globalThis.__serverboxDataSourceCache;

  if (!cached || cached.version !== DATA_SOURCE_SCHEMA_VERSION) {
    if (cached) {
      cached.promise
        .then(async (dataSource) => {
          if (dataSource.isInitialized) {
            await dataSource.destroy();
          }
        })
        .catch(() => {
          return;
        });
    }

    globalThis.__serverboxDataSourceCache = {
      version: DATA_SOURCE_SCHEMA_VERSION,
      promise: createDataSource(),
    };
  }

  return globalThis.__serverboxDataSourceCache!.promise;
}
