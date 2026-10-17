-- Shared by the app (src/server/db.server.ts) and the admin CLI (scripts/admin.mjs).
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS discount_codes (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('percent', 'fixed')),
  value INTEGER NOT NULL CHECK (value > 0),
  active INTEGER NOT NULL DEFAULT 1,
  min_total INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  uses INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  ref TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ny' CHECK (status IN ('ny', 'betald', 'skickad', 'avbruten')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  zip TEXT NOT NULL,
  city TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  discount_code TEXT,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  tracking TEXT NOT NULL DEFAULT '',
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_lines (
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  amount TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  qty INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_events (
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  message TEXT NOT NULL
);
