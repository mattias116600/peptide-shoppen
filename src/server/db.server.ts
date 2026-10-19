// Server-only SQLite access. node:sqlite ships with Node 22.13+, so the VPS needs no native add-ons.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import schema from './schema.sql?raw';
import { seedContent } from './seed.server';

let db: DatabaseSync | undefined;

export function dbPath() {
  return process.env['DATABASE_PATH'] ?? path.resolve(process.cwd(), 'data', 'peptidesweden.db');
}

export function getDb(): DatabaseSync {
  if (db) return db;
  const file = dbPath();
  if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(schema);
  migrate(db);
  seedContent(db);
  return db;
}

// Columns added after the first release; CREATE TABLE IF NOT EXISTS does not add them to older files.
const addedOrderColumns: [string, string][] = [
  ['public_token', "TEXT NOT NULL DEFAULT ''"],
  ['payment_provider', 'TEXT'],
  ['payment_ref', 'TEXT'],
  ['payment_url', 'TEXT'],
  ['payment_status', 'TEXT'],
  ['confirmation_email_at', 'TEXT'],
  ['shipping_email_at', 'TEXT'],
  ['shipping', 'INTEGER NOT NULL DEFAULT 0'],
];

const addedProductGroupColumns: [string, string][] = [
  ['kind', "TEXT NOT NULL DEFAULT 'peptid'"],
  ['quantity_presets', "TEXT NOT NULL DEFAULT '[]'"],
];

function migrate(conn: DatabaseSync) {
  for (const [table, columns] of [['orders', addedOrderColumns], ['product_groups', addedProductGroupColumns]] as const) {
    const existing = new Set((conn.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(c => c.name));
    for (const [name, type] of columns) {
      if (!existing.has(name)) conn.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
    }
  }
}

/** Test helper: point the module at a fresh database. */
export function resetDbForTests(file = ':memory:') {
  db?.close();
  db = undefined;
  process.env['DATABASE_PATH'] = file;
}

export function transaction<T>(fn: (db: DatabaseSync) => T): T {
  const conn = getDb();
  conn.exec('BEGIN IMMEDIATE');
  try {
    const result = fn(conn);
    conn.exec('COMMIT');
    return result;
  } catch (error) {
    conn.exec('ROLLBACK');
    throw error;
  }
}

export const nowIso = () => new Date().toISOString();
