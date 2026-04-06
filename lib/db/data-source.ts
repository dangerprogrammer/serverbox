import "reflect-metadata";
import "server-only";

import fs from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

import Database from "better-sqlite3";
import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";
import { BallInventoryMovementEntity } from "@/lib/db/entities/ball-inventory-movement.entity";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import { CondominiumPaymentEntity } from "@/lib/db/entities/condominium-payment.entity";
import { seedDatabase } from "@/lib/db/seed";
import { DataSource, type DataSourceOptions } from "typeorm";

declare global {
  var __serverboxDataSourceCache:
    | {
        version: string;
        promise: Promise<DataSource>;
      }
    | undefined;
}

const DATA_SOURCE_SCHEMA_VERSION = "2026-04-01-condominium-plans-embedded";

const entities = [
  AdministratorEntity,
  CondominiumEntity,
  CondominiumPaymentEntity,
  BallInventoryMovementEntity,
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
  return process.env.DATABASE_URL?.trim() || ormConfig.url?.trim();
}

function getDatabasePath() {
  return path.join(
    process.cwd(),
    "data",
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
  const databaseUrl = getDatabaseUrl();
  const databaseType =
    ormConfig.type === "better-sqlite3" ? "better-sqlite3" : "postgres";

  if (databaseUrl && databaseType === "postgres") {
    return {
      type: "postgres",
      url: databaseUrl,
      ssl: ormConfig.ssl ?? {
        rejectUnauthorized: false,
      },
      uuidExtension: "pgcrypto",
      synchronize: ormConfig.synchronize ?? true,
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

async function createDataSource() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    const databasePath = getDatabasePath();
    await mkdir(path.dirname(databasePath), { recursive: true });
    await resetLegacyDatabaseIfNeeded(databasePath);
  }

  const initialize = async () => {
    const dataSource = new DataSource(createDataSourceOptions());

    await dataSource.initialize();
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
