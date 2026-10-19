#!/usr/bin/env node
// Draws the site icons (Swedish-flag mark, as in the header) into public/ with no image libraries:
// favicon.ico (16/32/48), icon.svg, apple-touch-icon.png (180), icon-192.png, icon-512.png and a
// maskable icon-maskable-512.png. Run with `node scripts/generate-icons.mjs` after changing the design.
import { writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';

const BLUE = [0x00, 0x65, 0xa4];
const YELLOW = [0xfe, 0xcc, 0x02];
const out = new URL('../public/', import.meta.url);

// Square crop of the flag: the vertical bar sits left of centre like the real Nordic cross.
const cross = { v: [0.3, 0.48], h: [0.41, 0.59] };

/** Colour at (x, y) in a 0..1 square, or null outside the rounded corners. */
function shade(x, y, { radius, inset }) {
  if (radius > 0) {
    const cx = Math.min(Math.max(x, radius), 1 - radius);
    const cy = Math.min(Math.max(y, radius), 1 - radius);
    if ((x - cx) ** 2 + (y - cy) ** 2 > radius ** 2) return null; // outside the rounded corner
  }
  const u = (x - inset) / (1 - 2 * inset);
  const v = (y - inset) / (1 - 2 * inset);
  const inFlag = u >= 0 && u <= 1 && v >= 0 && v <= 1;
  const onCross = inFlag && ((u >= cross.v[0] && u <= cross.v[1]) || (v >= cross.h[0] && v <= cross.h[1]));
  return onCross ? YELLOW : BLUE;
}

function render(size, opts) {
  const ss = 4; // supersampling for smooth corners and edges
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const c = shade((x + (sx + 0.5) / ss) / size, (y + (sy + 0.5) / ss) / size, opts);
        if (c) { r += c[0]; g += c[1]; b += c[2]; a += 1; }
      }
      const i = (y * size + x) * 4;
      if (a) { px[i] = Math.round(r / a); px[i + 1] = Math.round(g / a); px[i + 2] = Math.round(b / a); }
      px[i + 3] = Math.round((a / (ss * ss)) * 255);
    }
  }
  return px;
}

function png(size, px) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/** ICO container holding PNG images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const dir = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e[0] = size % 256; e[1] = size % 256; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8); e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...dir, ...images.map(i => i.data)]);
}

const favicon = { radius: 0.18, inset: 0 };
const icon = size => png(size, render(size, favicon));
writeFileSync(new URL('favicon.ico', out), ico([16, 32, 48].map(size => ({ size, data: icon(size) }))));
writeFileSync(new URL('icon-192.png', out), icon(192));
writeFileSync(new URL('icon-512.png', out), icon(512));
// iOS rounds the corners itself and shows transparency as black, so this one is a full square.
writeFileSync(new URL('apple-touch-icon.png', out), png(180, render(180, { radius: 0, inset: 0 })));
// Android crops maskable icons to its own shape; a full-bleed flag still reads as the flag when cropped.
writeFileSync(new URL('icon-maskable-512.png', out), png(512, render(512, { radius: 0, inset: 0 })));

const hex = c => `#${c.map(n => n.toString(16).padStart(2, '0')).join('')}`;
writeFileSync(new URL('icon.svg', out), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="${hex(BLUE)}"/><rect x="${cross.v[0] * 100}" width="${(cross.v[1] - cross.v[0]) * 100}" height="100" fill="${hex(YELLOW)}"/><rect y="${cross.h[0] * 100}" width="100" height="${(cross.h[1] - cross.h[0]) * 100}" fill="${hex(YELLOW)}"/></svg>\n`);
console.log('Icons written to public/');
