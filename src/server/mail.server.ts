// Outgoing email. Works with any SMTP provider (your domain's mail host, Brevo, Mailgun, Postmark, ...).
// MAIL_TRANSPORT=outbox writes .eml files to data/outbox instead of sending, for testing.
import path from 'node:path';
import nodemailer, { type Transporter } from 'nodemailer';
import { dbPath } from './db.server';

export type MailMessage = { to: string; subject: string; text: string; html: string };
export type MailConfig =
  | { kind: 'smtp'; from: string; replyTo: string | undefined; host: string; port: number; secure: boolean; user: string | undefined; pass: string | undefined }
  | { kind: 'outbox'; from: string; replyTo: string | undefined; dir: string };

/** Null when email is not set up; orders still work, the admin just sees that nothing was sent. */
export function mailConfig(env: Record<string, string | undefined> = process.env): MailConfig | null {
  const from = env['MAIL_FROM']?.trim();
  if (!from) return null;
  const replyTo = env['MAIL_REPLY_TO']?.trim() || undefined;
  if (env['MAIL_TRANSPORT']?.trim() === 'outbox') {
    return { kind: 'outbox', from, replyTo, dir: env['MAIL_OUTBOX_DIR']?.trim() || path.join(path.dirname(path.resolve(dbPath())), 'outbox') };
  }
  const host = env['SMTP_HOST']?.trim();
  if (!host) return null;
  const port = Number(env['SMTP_PORT'] || 587);
  return {
    kind: 'smtp', from, replyTo, host, port,
    // Port 465 uses TLS from the start; 587 upgrades with STARTTLS (required below).
    secure: env['SMTP_SECURE'] ? env['SMTP_SECURE'] === 'true' : port === 465,
    user: env['SMTP_USER']?.trim() || undefined,
    pass: env['SMTP_PASS'] || undefined,
  };
}

let cached: { key: string; transporter: Transporter } | undefined;

function transporterFor(config: MailConfig): Transporter {
  const key = JSON.stringify(config);
  if (cached?.key === key) return cached.transporter;
  const transporter =
    config.kind === 'outbox'
      ? nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' })
      : nodemailer.createTransport({
          host: config.host, port: config.port, secure: config.secure, requireTLS: !config.secure,
          ...(config.user ? { auth: { user: config.user, pass: config.pass ?? '' } } : {}),
          connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 30_000,
        });
  cached = { key, transporter };
  return transporter;
}

export async function sendMail(config: MailConfig, message: MailMessage): Promise<void> {
  const info = await transporterFor(config).sendMail({
    from: config.from, ...(config.replyTo ? { replyTo: config.replyTo } : {}),
    to: message.to, subject: message.subject, text: message.text, html: message.html,
  });
  if (config.kind === 'outbox') {
    const { mkdirSync, writeFileSync } = await import('node:fs');
    mkdirSync(config.dir, { recursive: true });
    const safe = message.subject.replace(/[^\w-]+/g, '-').slice(0, 60);
    writeFileSync(path.join(config.dir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${safe}.eml`), (info as unknown as { message: Buffer }).message);
  }
}
