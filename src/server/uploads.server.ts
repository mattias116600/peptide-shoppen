// Admin image uploads, stored next to the database (data/uploads) and served from /media/<file>.
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { dbPath } from './db.server';
import { OrderError } from './errors.server';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const types = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg' } as const;
type Ext = keyof typeof types;

export function uploadsDir() {
  return process.env['UPLOADS_DIR'] ?? path.join(path.dirname(path.resolve(dbPath())), 'uploads');
}

/** Detects the format from the file's first bytes; the browser-supplied type and name are not trusted. */
export function sniffImage(bytes: Uint8Array): Ext | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  return null;
}

export function saveUpload(bytes: Uint8Array): string {
  if (bytes.length > MAX_UPLOAD_BYTES) throw new OrderError('Bilden är för stor (max 5 MB).');
  const ext = sniffImage(bytes);
  if (!ext) throw new OrderError('Endast WebP-, PNG- och JPEG-bilder stöds.');
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}.${ext}`;
  mkdirSync(uploadsDir(), { recursive: true });
  writeFileSync(path.join(uploadsDir(), name), bytes, { flag: 'wx' });
  return `/media/${name}`;
}

export function readUpload(name: string): { body: Buffer; type: string } | null {
  const m = /^[a-z0-9]+-[a-f0-9]{12}\.(webp|png|jpg)$/.exec(name);
  if (!m) return null;
  try {
    return { body: readFileSync(path.join(uploadsDir(), name)), type: types[m[1] as Ext] };
  } catch {
    return null;
  }
}
