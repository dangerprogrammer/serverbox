import "reflect-metadata";

import path from "node:path";
import fs from "node:fs";

import { DataSource } from "typeorm";

import { AdministratorEntity } from "../lib/db/entities/administrator.entity";
import { CondominiumEntity } from "../lib/db/entities/condominium.entity";
import { CondominiumPaymentEntity } from "../lib/db/entities/condominium-payment.entity";
import { BallInventoryMovementEntity } from "../lib/db/entities/ball-inventory-movement.entity";
import { AdminSessionEntity } from "../lib/db/entities/admin-session.entity";
import { seedDatabase } from "../lib/db/seed";

async function main() {
  const confirm = process.env.CONFIRM_RESEED === "true";
  const databaseUrl = (process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL || process.env.DB_FILENAME) as string | undefined;

  if (!confirm) {
    console.error("Refusing to run: set CONFIRM_RESEED=true to confirm reseed.");
    process.exit(1);
  }

  if (!databaseUrl) {
    console.error("Refusing to run: set DATABASE_URL (or POSTGRES_URL / SUPABASE_DB_URL) to point to the target DB.");
    process.exit(1);
  }

  const entities = [
    AdministratorEntity,
    CondominiumEntity,
    CondominiumPaymentEntity,
    BallInventoryMovementEntity,
    AdminSessionEntity,
  ];

  const isSqlite = databaseUrl.endsWith(".sqlite") || databaseUrl.endsWith(".db") || databaseUrl.includes(".sqlite");

  const dataSourceOptions: any = isSqlite
    ? {
        type: "better-sqlite3",
        database: databaseUrl,
        synchronize: true,
        entities,
      }
    : {
        type: "postgres",
        url: databaseUrl,
        ssl: { rejectUnauthorized: false },
        synchronize: true,
        uuidExtension: "pgcrypto",
        entities,
      };

  const ds = new DataSource(dataSourceOptions);

  try {
    console.log("Initializing DataSource (synchronize=true)...");
    await ds.initialize();

    console.log("Running seedDatabase()...");
    await seedDatabase(ds);

    console.log("Seed completed successfully.");
  } catch (err) {
    console.error("Reseed failed:", err);
    process.exitCode = 2;
  } finally {
    if (ds.isInitialized) {
      await ds.destroy();
    }
  }
}

if (require.main === module) {
  main();
}
