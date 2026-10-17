// Admin authentication: scrypt password hashes, opaque session tokens stored hashed, and a login throttle.
// Accounts are created only from the server shell (scripts/admin.mjs); there is no public sign-up.
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getDb, nowIso } from './db.server';

const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;
export const SESSION_HOURS = 12;

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string) {
  const [alg, n, r, p, salt, hash] = stored.split('$');
  if (alg !== 'scrypt' || !n || !r || !p || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = scryptSync(password, Buffer.from(salt, 'base64'), expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem });
  return timingSafeEqual(actual, expected);
}

// Verified against when the username does not exist, so both paths cost the same time.
let dummyHash: string | undefined;

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export type AdminIdentity = { id: number; username: string };

export function checkCredentials(username: string, password: string): AdminIdentity | null {
  const row = getDb().prepare('SELECT id, username, password_hash FROM admins WHERE username = ?').get(username.trim()) as
    | { id: number; username: string; password_hash: string }
    | undefined;
  if (!row) {
    dummyHash ??= hashPassword(randomBytes(12).toString('hex'));
    verifyPassword(password, dummyHash);
    return null;
  }
  return verifyPassword(password, row.password_hash) ? { id: row.id, username: row.username } : null;
}

export function createSession(adminId: number) {
  const token = randomBytes(32).toString('base64url');
  const created = new Date();
  const expires = new Date(created.getTime() + SESSION_HOURS * 3600_000);
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(created.toISOString());
  db.prepare('INSERT INTO sessions (token_hash, admin_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(sha256(token), adminId, created.toISOString(), expires.toISOString());
  return { token, expires };
}

export function sessionAdmin(token: string | undefined): AdminIdentity | null {
  if (!token || token.length > 100) return null;
  const row = getDb()
    .prepare('SELECT a.id, a.username FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE s.token_hash = ? AND s.expires_at > ?')
    .get(sha256(token), nowIso()) as { id: number; username: string } | undefined;
  return row ? { id: row.id, username: row.username } : null;
}

export function destroySession(token: string | undefined) {
  if (token) getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

// In-memory throttle: the site runs as one Node process behind Nginx.
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 5;
const failures = new Map<string, number[]>();

function recent(key: string, now: number) {
  const list = (failures.get(key) ?? []).filter(t => now - t < WINDOW_MS);
  if (list.length) failures.set(key, list);
  else failures.delete(key);
  return list;
}

/** Minutes until another attempt is allowed, or 0 when not locked. */
export function loginLockMinutes(keys: string[], now = Date.now()) {
  let wait = 0;
  for (const key of keys) {
    const list = recent(key, now);
    if (list.length >= MAX_FAILURES) wait = Math.max(wait, WINDOW_MS - (now - list[0]!));
  }
  return Math.ceil(wait / 60_000);
}

export function recordLoginFailure(keys: string[], now = Date.now()) {
  for (const key of keys) failures.set(key, [...recent(key, now), now]);
}

export function clearLoginFailures(keys: string[]) {
  for (const key of keys) failures.delete(key);
}
