// Shared helpers for server functions and server routes.
import { getCookie, getRequestHeader, getRequestIP } from '@tanstack/react-start/server';
import { sessionAdmin } from './auth.server';
import { OrderError } from './errors.server';

export const ADMIN_COOKIE = 'psw_admin';

// Nginx overwrites X-Real-IP with the connecting address; the app itself only listens on 127.0.0.1.
export const clientIp = () => getRequestHeader('x-real-ip') ?? getRequestIP() ?? 'unknown';

export function requireAdmin() {
  const admin = sessionAdmin(getCookie(ADMIN_COOKIE));
  if (!admin) throw new Error('Inte inloggad.');
  return admin;
}

/** Turns expected business errors into a result the UI can show instead of a 500. */
export function attempt<T>(fn: () => T): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: fn() };
  } catch (error) {
    if (error instanceof OrderError || (error instanceof Error && error.message.startsWith('Ogiltig'))) return { ok: false, error: error.message };
    throw error;
  }
}
