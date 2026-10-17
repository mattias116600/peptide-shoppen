#!/usr/bin/env node
// Manage admin accounts from the server shell. There is deliberately no sign-up page.
//   npm run admin -- create <användarnamn>
//   npm run admin -- password <användarnamn>
//   npm run admin -- list
//   npm run admin -- delete <användarnamn>
// Reads DATABASE_PATH like the app (default: ./data/peptidesweden.db).
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline';
import { DatabaseSync } from 'node:sqlite';

const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const MIN_LENGTH = 12;

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function openDb() {
  const file = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data', 'peptidesweden.db');
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(readFileSync(new URL('../src/server/schema.sql', import.meta.url), 'utf8'));
  return { db, file };
}

// One readline interface with a line queue, so piped input (two password lines) is not lost between
// prompts. Typed characters are not echoed when attached to a terminal.
let rl;
let muted = false;
const lines = [];
const waiting = [];
let closed = false;
function setup() {
  rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
  rl._writeToOutput = text => { if (!muted) process.stdout.write(text); };
  rl.on('line', line => (waiting.length ? waiting.shift().resolve(line) : lines.push(line)));
  rl.on('close', () => { closed = true; for (const w of waiting.splice(0)) w.reject(new Error('Ingen inmatning.')); });
}
function ask(question, hidden) {
  if (!rl) setup();
  process.stdout.write(question);
  muted = Boolean(hidden && process.stdin.isTTY);
  return new Promise((resolve, reject) => {
    const done = answer => { muted = false; if (hidden && process.stdin.isTTY) process.stdout.write('\n'); resolve(answer); };
    if (lines.length) done(lines.shift());
    else if (closed) reject(new Error('Ingen inmatning.'));
    else waiting.push({ resolve: done, reject });
  });
}

async function newPassword() {
  const first = await ask('Nytt lösenord: ', true);
  if (first.length < MIN_LENGTH) throw new Error(`Lösenordet måste vara minst ${MIN_LENGTH} tecken.`);
  const second = await ask('Upprepa lösenordet: ', true);
  if (first !== second) throw new Error('Lösenorden matchar inte.');
  return first;
}

async function main() {
  const [command, username] = process.argv.slice(2);
  const { db, file } = openDb();
  const find = name => db.prepare('SELECT id, username FROM admins WHERE username = ?').get(name);
  const needUser = () => { if (!username || !/^[A-Za-z0-9._-]{3,64}$/.test(username)) throw new Error('Ange ett användarnamn (3–64 tecken, A–Z, 0–9, . _ -).'); };

  switch (command) {
    case 'create': {
      needUser();
      if (find(username)) throw new Error(`Användaren ${username} finns redan.`);
      db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, hashPassword(await newPassword()));
      console.log(`Admin ${username} skapad i ${file}.`);
      break;
    }
    case 'password': {
      needUser();
      const admin = find(username);
      if (!admin) throw new Error(`Användaren ${username} finns inte.`);
      db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hashPassword(await newPassword()), admin.id);
      db.prepare('DELETE FROM sessions WHERE admin_id = ?').run(admin.id);
      console.log(`Lösenord bytt för ${username}. Alla inloggningar har loggats ut.`);
      break;
    }
    case 'delete': {
      needUser();
      const { changes } = db.prepare('DELETE FROM admins WHERE username = ?').run(username);
      console.log(changes ? `Admin ${username} borttagen.` : `Användaren ${username} finns inte.`);
      break;
    }
    case 'list': {
      const rows = db.prepare('SELECT username, created_at FROM admins ORDER BY username').all();
      if (!rows.length) console.log('Inga admin-konton ännu. Skapa ett med: npm run admin -- create <namn>');
      for (const r of rows) console.log(`${r.username}\t(skapad ${r.created_at})`);
      break;
    }
    default:
      console.log('Användning: npm run admin -- create|password|delete <användarnamn>  eller  npm run admin -- list');
      process.exitCode = 1;
  }
  db.close();
  rl?.close();
}

main().catch(error => {
  rl?.close();
  console.error(`Fel: ${error.message}`);
  process.exit(1);
});
