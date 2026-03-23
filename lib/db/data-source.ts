import "reflect-metadata";
import "server-only";

import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

import Database from "better-sqlite3";
import { AdministratorEntity } from "@/lib/db/entities/administrator.entity";
import { BallInventoryMovementEntity } from "@/lib/db/entities/ball-inventory-movement.entity";
import { CondominiumEntity } from "@/lib/db/entities/condominium.entity";
import { CondominiumPlanEntity } from "@/lib/db/entities/condominium-plan.entity";
import { CondominiumPaymentEntity } from "@/lib/db/entities/condominium-payment.entity";
import { PlanEntity } from "@/lib/db/entities/plan.entity";
import { seedDatabase } from "@/lib/db/seed";
import { DataSource } from "typeorm";

declare global {
  var __serverboxDataSourcePromise: Promise<DataSource> | undefined;
}

function getDatabasePath() {
  return path.join(
    process.cwd(),
    "data",
    process.env.DB_FILENAME ?? "serverbox.sqlite",
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

    database.close();
    database = null;

    if (
      hasLegacySubscriptionsTable ||
      !hasPrimaryAdminId ||
      !hasPaymentTable ||
      !hasInventoryTable
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

async function createDataSource() {
  const databasePath = getDatabasePath();

  await mkdir(path.dirname(databasePath), { recursive: true });
  await resetLegacyDatabaseIfNeeded(databasePath);

  const initialize = async () => {
    const dataSource = new DataSource({
      type: "better-sqlite3",
      database: databasePath,
      synchronize: true,
      entities: [
        AdministratorEntity,
        PlanEntity,
        CondominiumEntity,
        CondominiumPlanEntity,
        CondominiumPaymentEntity,
        BallInventoryMovementEntity,
      ],
    });

    await dataSource.initialize();
    await seedDatabase(dataSource);

    return dataSource;
  };

  return initialize();
}

export async function getDataSource() {
  if (!globalThis.__serverboxDataSourcePromise) {
    globalThis.__serverboxDataSourcePromise = createDataSource();
  }

  return globalThis.__serverboxDataSourcePromise;
}
