#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
const { randomBytes, randomUUID, scryptSync } = require('node:crypto');

async function main() {
  const confirm = process.env.CONFIRM_RESEED === 'true';
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@servebox.local';
  const adminName = process.env.ADMIN_DEFAULT_NAME || 'Operação ServeBox';
  const adminPassword = (process.env.ADMIN_DEFAULT_PASSWORD || 'admin123456').trim();

  if (!confirm) {
    console.error('Refusing to run: set CONFIRM_RESEED=true to confirm reseed.');
    process.exit(1);
  }

  if (!databaseUrl) {
    console.error('Refusing to run: DATABASE_URL / POSTGRES_URL / SUPABASE_DB_URL not set.');
    process.exit(1);
  }

  // Only supporting Postgres for the production reseed script.
  if (!databaseUrl.startsWith('postgres')) {
    console.error('This reseed script currently supports Postgres database URLs only.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    // Ensure administrators table exists (minimal schema)
    await client.query(`
      CREATE TABLE IF NOT EXISTS administrators (
        id uuid PRIMARY KEY,
        name text NOT NULL,
        email text UNIQUE NOT NULL,
        "passwordHash" text,
        "createdAt" timestamp without time zone DEFAULT now(),
        "updatedAt" timestamp without time zone DEFAULT now()
      );
    `);

    // Check existing admin
    const res = await client.query('SELECT id FROM administrators WHERE email = $1 LIMIT 1', [adminEmail]);

    if (res.rowCount > 0) {
      console.log('Administrator already exists; skipping insert.');
      return;
    }

    // Hash password using scrypt (same algorithm as the app)
    const salt = randomBytes(16).toString('hex');
    const KEY_LENGTH = 64;
    const hash = scryptSync(adminPassword, salt, KEY_LENGTH).toString('hex');
    const passwordHash = `${salt}:${hash}`;

    const id = randomUUID();

    await client.query(
      'INSERT INTO administrators(id, name, email, "passwordHash", "createdAt", "updatedAt") VALUES($1,$2,$3,$4,now(),now())',
      [id, adminName, adminEmail, passwordHash]
    );

    console.log('Administrator created:', adminEmail);
  } catch (err) {
    console.error('Reseed failed:', err);
    process.exitCode = 2;
  } finally {
    try { await client.end(); } catch {};
  }
}

if (require.main === module) main();
