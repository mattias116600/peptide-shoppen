// Sends the order confirmation and shipping emails, at most once each unless resent from the admin,
// and records every attempt in the order history so the admin can see what the customer received.
import { getDb, nowIso } from './db.server';
import { mailConfig, sendMail, type MailConfig } from './mail.server';
import { orderConfirmationEmail, shippingEmail, type EmailOrder } from './email-templates.server';

export type OrderEmailKind = 'confirmation' | 'shipping';
export type OrderEmailResult = { sent: boolean; message: string };

const labels: Record<OrderEmailKind, string> = { confirmation: 'Orderbekräftelse', shipping: 'Leveransmejl' };
const column: Record<OrderEmailKind, 'confirmation_email_at' | 'shipping_email_at'> = { confirmation: 'confirmation_email_at', shipping: 'shipping_email_at' };

type Row = {
  id: number; ref: string; name: string; email: string; phone: string; address: string; zip: string; city: string; subtotal: number;
  discount_code: string | null; discount_amount: number; total: number; created_at: string; public_token: string; payment_url: string | null;
  payment_status: string | null; tracking: string; status: string; confirmation_email_at: string | null; shipping_email_at: string | null;
};

function loadOrder(ref: string): (EmailOrder & { id: number; status: string; sentAt: Record<OrderEmailKind, string | null> }) | null {
  const db = getDb();
  const o = db.prepare('SELECT * FROM orders WHERE ref = ?').get(ref) as Row | undefined;
  if (!o) return null;
  const lines = (db.prepare('SELECT slug, name, amount, unit_price, qty FROM order_lines WHERE order_id = ? ORDER BY rowid').all(o.id) as { slug: string; name: string; amount: string; unit_price: number; qty: number }[])
    .map(l => ({ slug: l.slug, name: l.name, amount: l.amount, unitPrice: l.unit_price, qty: l.qty }));
  const site = process.env['PUBLIC_SITE_URL']?.trim().replace(/\/+$/, '');
  return {
    id: o.id, status: o.status, ref: o.ref, name: o.name, email: o.email, phone: o.phone, address: o.address, zip: o.zip, city: o.city,
    subtotal: o.subtotal, discountCode: o.discount_code, discountAmount: o.discount_amount, total: o.total, lines, createdAt: o.created_at,
    paymentUrl: o.payment_url, paymentStatus: o.payment_status, tracking: o.tracking,
    statusUrl: site && o.public_token ? `${site}/kassa/tack?order=${encodeURIComponent(o.ref)}&t=${encodeURIComponent(o.public_token)}` : null,
    sentAt: { confirmation: o.confirmation_email_at, shipping: o.shipping_email_at },
  };
}

const log = (orderId: number, actor: string, message: string) =>
  getDb().prepare('INSERT INTO order_events (order_id, at, actor, message) VALUES (?, ?, ?, ?)').run(orderId, nowIso(), actor, message);

export async function sendOrderEmail(
  ref: string,
  kind: OrderEmailKind,
  actor: string,
  opts: { force?: boolean; config?: MailConfig | null } = {},
): Promise<OrderEmailResult> {
  const order = loadOrder(ref);
  if (!order) return { sent: false, message: 'Ordern finns inte.' };
  if (order.sentAt[kind] && !opts.force) return { sent: false, message: `${labels[kind]} är redan skickad.` };
  const config = opts.config === undefined ? mailConfig() : opts.config;
  if (!config) {
    const message = `${labels[kind]} skickades inte: e-post är inte inställd på servern.`;
    log(order.id, 'system', message);
    return { sent: false, message };
  }
  try {
    await sendMail(config, kind === 'confirmation' ? orderConfirmationEmail(order) : shippingEmail(order));
    getDb().prepare(`UPDATE orders SET ${column[kind]} = ? WHERE id = ?`).run(nowIso(), order.id);
    const message = `${labels[kind]} skickad till ${order.email}${opts.force ? ' (skickad igen)' : ''}`;
    log(order.id, actor, message);
    return { sent: true, message };
  } catch (error) {
    console.error(`${labels[kind]} för ${ref} misslyckades:`, error);
    const message = `${labels[kind]} kunde inte skickas: ${error instanceof Error ? error.message.slice(0, 160) : 'okänt fel'}`;
    log(order.id, actor, message);
    return { sent: false, message };
  }
}

/** The shipping email goes out automatically once an order is marked shipped and has a tracking number. */
export async function sendShippingEmailIfReady(ref: string, actor: string): Promise<OrderEmailResult | null> {
  const order = loadOrder(ref);
  if (!order || order.status !== 'skickad' || order.sentAt.shipping || !order.tracking.trim()) return null;
  return sendOrderEmail(ref, 'shipping', actor);
}

/** Starts a send without making the caller wait; failures are already logged on the order. */
export function sendInBackground(ref: string, kind: OrderEmailKind, actor: string) {
  void sendOrderEmail(ref, kind, actor).catch(error => console.error('Order email failed:', error));
}
