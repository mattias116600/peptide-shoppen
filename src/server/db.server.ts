// Server-only SQLite access. node:sqlite ships with Node 22.13+, so the VPS needs no native add-ons.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import schema from './schema.sql?raw';

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
  return db;
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
