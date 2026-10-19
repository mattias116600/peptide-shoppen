// Server-only order and discount storage.
import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { getDb, nowIso, transaction } from './db.server';
import { OrderError } from './errors.server';
import { getStorefrontCatalog } from './catalog.server';
import {
  evaluateDiscount, linesSubtotal, normalizeCode, priceLines,
  PAID_PAYMENT_STATUSES, type CustomerInput, type DiscountKind, type DiscountRule, type OrderStatus, type PaymentInfo, type PlacedOrder,
} from '@/lib/commerce';
import { shippingFee } from '@/lib/products';

type DiscountRow = { id: number; code: string; kind: DiscountKind; value: number; active: number; min_total: number; max_uses: number | null; uses: number; expires_at: string | null; created_at: string };
export type DiscountCode = DiscountRule & { id: number; createdAt: string };

const toDiscount = (r: DiscountRow): DiscountCode => ({
  id: r.id, code: r.code, kind: r.kind, value: r.value, active: r.active === 1, minTotal: r.min_total,
  maxUses: r.max_uses, uses: r.uses, expiresAt: r.expires_at, createdAt: r.created_at,
});

function findDiscount(db: DatabaseSync, code: string) {
  const row = db.prepare('SELECT * FROM discount_codes WHERE code = ?').get(normalizeCode(code)) as DiscountRow | undefined;
  return row ? toDiscount(row) : undefined;
}

export type CartInput = { slug: string; quantity: number }[];

export function quoteDiscount(code: string, cart: CartInput) {
  const subtotal = linesSubtotal(priceLines(cart, getStorefrontCatalog().products));
  const rule = findDiscount(getDb(), code);
  if (!rule) throw new OrderError('Rabattkoden finns inte.');
  const check = evaluateDiscount(rule, subtotal);
  if (!check.ok) throw new OrderError(check.reason);
  const shipping = shippingFee(subtotal - check.amount);
  return { code: rule.code, amount: check.amount, subtotal, shipping, total: subtotal - check.amount + shipping };
}


export { OrderError };

export function placeOrder(customer: CustomerInput, cart: CartInput, discountCode?: string): PlacedOrder & { publicToken: string } {
  const lines = priceLines(cart, getStorefrontCatalog().products);
  if (!lines.length) throw new OrderError('Varukorgen är tom.');
  const subtotal = linesSubtotal(lines);
  return transaction(db => {
    let discountAmount = 0;
    let appliedCode: string | null = null;
    if (discountCode?.trim()) {
      const rule = findDiscount(db, discountCode);
      if (!rule) throw new OrderError('Rabattkoden finns inte.');
      const check = evaluateDiscount(rule, subtotal);
      if (!check.ok) throw new OrderError(check.reason);
      db.prepare('UPDATE discount_codes SET uses = uses + 1 WHERE id = ?').run(rule.id);
      discountAmount = check.amount;
      appliedCode = rule.code;
    }
    const createdAt = nowIso();
    let ref = '';
    do ref = `PSW-${randomInt(100000, 1000000)}`;
    while (db.prepare('SELECT 1 FROM orders WHERE ref = ?').get(ref));
    const shipping = shippingFee(subtotal - discountAmount);
    const total = subtotal - discountAmount + shipping;
    // Lets the customer's browser look up its own order status without guessing order numbers.
    const publicToken = randomBytes(18).toString('base64url');
    const { lastInsertRowid } = db
      .prepare(`INSERT INTO orders (ref, name, email, phone, address, zip, city, subtotal, discount_code, discount_amount, shipping, total, public_token, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(ref, customer.name, customer.email, customer.phone, customer.address, customer.zip, customer.city, subtotal, appliedCode, discountAmount, shipping, total, publicToken, createdAt, createdAt);
    const insertLine = db.prepare('INSERT INTO order_lines (order_id, slug, name, amount, unit_price, qty) VALUES (?, ?, ?, ?, ?, ?)');
    for (const l of lines) insertLine.run(lastInsertRowid, l.slug, l.name, l.amount, l.unitPrice, l.qty);
    db.prepare('INSERT INTO order_events (order_id, at, actor, message) VALUES (?, ?, ?, ?)').run(lastInsertRowid, createdAt, 'kund', 'Beställning lagd i kassan');
    return { ...customer, ref, createdAt, subtotal, discountCode: appliedCode, discountAmount, shipping, total, lines, publicToken };
  });
}

type OrderRow = { id: number; ref: string; status: OrderStatus; public_token: string; payment_provider: string | null; payment_ref: string | null; payment_url: string | null; payment_status: string | null; name: string; email: string; phone: string; address: string; zip: string; city: string; subtotal: number; discount_code: string | null; discount_amount: number; shipping: number; total: number; tracking: string; admin_note: string; created_at: string; updated_at: string };
export type OrderSummary = { ref: string; status: OrderStatus; name: string; email: string; total: number; itemCount: number; discountCode: string | null; createdAt: string };
export type OrderDetail = PlacedOrder & { payment: PaymentInfo; status: OrderStatus; tracking: string; adminNote: string; updatedAt: string; events: { at: string; actor: string; message: string }[] };

export function listOrders(opts: { status?: OrderStatus | undefined; q?: string | undefined; limit?: number; offset?: number }) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.status) { where.push('o.status = ?'); params.push(opts.status); }
  if (opts.q?.trim()) {
    const like = `%${opts.q.trim().replace(/[%_\\]/g, m => `\\${m}`)}%`;
    where.push("(o.ref LIKE ? ESCAPE '\\' OR o.name LIKE ? ESCAPE '\\' OR o.email LIKE ? ESCAPE '\\' OR o.phone LIKE ? ESCAPE '\\')");
    params.push(like, like, like, like);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const db = getDb();
  const rows = db
    .prepare(`SELECT o.ref, o.status, o.name, o.email, o.total, o.discount_code, o.created_at,
                     (SELECT COALESCE(SUM(qty), 0) FROM order_lines l WHERE l.order_id = o.id) AS item_count
              FROM orders o ${clause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, opts.limit ?? 50, opts.offset ?? 0) as (Pick<OrderRow, 'ref' | 'status' | 'name' | 'email' | 'total' | 'discount_code' | 'created_at'> & { item_count: number })[];
  const { n } = db.prepare(`SELECT COUNT(*) AS n FROM orders o ${clause}`).get(...params) as { n: number };
  const orders: OrderSummary[] = rows.map(r => ({ ref: r.ref, status: r.status, name: r.name, email: r.email, total: r.total, itemCount: r.item_count, discountCode: r.discount_code, createdAt: r.created_at }));
  return { orders, total: n };
}

export function orderStats() {
  const rows = getDb().prepare('SELECT status, COUNT(*) AS n, COALESCE(SUM(total), 0) AS sum FROM orders GROUP BY status').all() as { status: OrderStatus; n: number; sum: number }[];
  const byStatus = { ny: 0, betald: 0, skickad: 0, avbruten: 0 } as Record<OrderStatus, number>;
  let revenue = 0;
  for (const r of rows) {
    byStatus[r.status] = r.n;
    if (r.status === 'betald' || r.status === 'skickad') revenue += r.sum;
  }
  return { byStatus, revenue };
}

export function getOrder(ref: string): OrderDetail | null {
  const db = getDb();
  const o = db.prepare('SELECT * FROM orders WHERE ref = ?').get(ref) as OrderRow | undefined;
  if (!o) return null;
  const lines = (db.prepare('SELECT slug, name, amount, unit_price, qty FROM order_lines WHERE order_id = ? ORDER BY rowid').all(o.id) as { slug: string; name: string; amount: string; unit_price: number; qty: number }[])
    .map(l => ({ slug: l.slug, name: l.name, amount: l.amount, unitPrice: l.unit_price, qty: l.qty }));
  const events = db.prepare('SELECT at, actor, message FROM order_events WHERE order_id = ? ORDER BY at DESC, rowid DESC').all(o.id) as { at: string; actor: string; message: string }[];
  return {
    ref: o.ref, status: o.status, name: o.name, email: o.email, phone: o.phone, address: o.address, zip: o.zip, city: o.city,
    subtotal: o.subtotal, discountCode: o.discount_code, discountAmount: o.discount_amount, shipping: o.shipping, total: o.total,
    tracking: o.tracking, adminNote: o.admin_note, createdAt: o.created_at, updatedAt: o.updated_at, lines, events,
    payment: { provider: o.payment_provider, ref: o.payment_ref, url: o.payment_url, status: o.payment_status },
  };
}

export function updateOrder(ref: string, actor: string, patch: { status?: OrderStatus | undefined; tracking?: string | undefined; adminNote?: string | undefined }) {
  return transaction(db => {
    const o = db.prepare('SELECT id, status, tracking, admin_note FROM orders WHERE ref = ?').get(ref) as Pick<OrderRow, 'id' | 'status' | 'tracking' | 'admin_note'> | undefined;
    if (!o) throw new OrderError('Ordern finns inte.');
    const at = nowIso();
    const log = (message: string) => db.prepare('INSERT INTO order_events (order_id, at, actor, message) VALUES (?, ?, ?, ?)').run(o.id, at, actor, message);
    const next = { status: patch.status ?? o.status, tracking: patch.tracking?.trim() ?? o.tracking, note: patch.adminNote ?? o.admin_note };
    if (next.status !== o.status) log(`Status ändrad: ${o.status} → ${next.status}`);
    if (next.tracking !== o.tracking) log(next.tracking ? `Spårningsnummer: ${next.tracking}` : 'Spårningsnummer borttaget');
    if (next.note !== o.admin_note) log('Intern anteckning uppdaterad');
    db.prepare('UPDATE orders SET status = ?, tracking = ?, admin_note = ?, updated_at = ? WHERE id = ?').run(next.status, next.tracking, next.note, at, o.id);
  });
}

function logEvent(db: DatabaseSync, orderId: number | bigint, actor: string, message: string, at = nowIso()) {
  db.prepare('INSERT INTO order_events (order_id, at, actor, message) VALUES (?, ?, ?, ?)').run(orderId, at, actor, message);
}

export function attachPayment(ref: string, payment: { provider: string; ref: string; url: string }) {
  transaction(db => {
    const o = db.prepare('SELECT id FROM orders WHERE ref = ?').get(ref) as { id: number } | undefined;
    if (!o) throw new OrderError('Ordern finns inte.');
    const at = nowIso();
    db.prepare("UPDATE orders SET payment_provider = ?, payment_ref = ?, payment_url = ?, payment_status = 'waiting', updated_at = ? WHERE id = ?").run(payment.provider, payment.ref, payment.url, at, o.id);
    logEvent(db, o.id, 'system', `Betalning skapad hos ${payment.provider} (faktura ${payment.ref})`, at);
  });
}

/** Cancels a fresh order whose payment could not be started, and gives back its discount use. */
export function cancelUnstartedOrder(ref: string, reason: string) {
  transaction(db => {
    const o = db.prepare('SELECT id, discount_code FROM orders WHERE ref = ?').get(ref) as { id: number; discount_code: string | null } | undefined;
    if (!o) return;
    const at = nowIso();
    db.prepare("UPDATE orders SET status = 'avbruten', updated_at = ? WHERE id = ?").run(at, o.id);
    if (o.discount_code) db.prepare('UPDATE discount_codes SET uses = MAX(uses - 1, 0) WHERE code = ?').run(o.discount_code);
    logEvent(db, o.id, 'system', `Avbruten: ${reason}`, at);
  });
}

export type PaymentUpdate = { provider: string; orderRef: string; invoiceId: string | null; paymentId: string; status: string; priceAmount: number; priceCurrency: string; paidText: string };
export type PaymentUpdateResult = 'updated' | 'unchanged' | 'unknown-order' | 'mismatch';

/** Applies a verified payment notification. Orders turn "betald" only when the full SEK amount is confirmed. */
export function recordPaymentUpdate(u: PaymentUpdate): PaymentUpdateResult {
  return transaction(db => {
    const o = db.prepare('SELECT id, status, total, payment_ref, payment_status FROM orders WHERE ref = ?').get(u.orderRef) as
      | Pick<OrderRow, 'id' | 'status' | 'total' | 'payment_ref' | 'payment_status'>
      | undefined;
    if (!o) return 'unknown-order';
    const at = nowIso();
    if ((u.invoiceId && o.payment_ref && u.invoiceId !== o.payment_ref) || u.priceCurrency !== 'sek' || Math.round(u.priceAmount) !== o.total) {
      logEvent(db, o.id, u.provider, `Avvisad betalningsnotis: belopp/faktura stämmer inte (${u.priceAmount} ${u.priceCurrency.toUpperCase()}, faktura ${u.invoiceId ?? '—'})`, at);
      return 'mismatch';
    }
    if (o.payment_status === u.status) return 'unchanged';
    // A late "confirming" must not undo a payment that is already confirmed.
    if (o.payment_status && PAID_PAYMENT_STATUSES.includes(o.payment_status) && !PAID_PAYMENT_STATUSES.includes(u.status) && u.status !== 'refunded') return 'unchanged';
    db.prepare('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?').run(u.status, at, o.id);
    logEvent(db, o.id, u.provider, `Betalning ${u.status}${u.paidText ? ` (${u.paidText})` : ''}, betalnings-id ${u.paymentId}`, at);
    if (PAID_PAYMENT_STATUSES.includes(u.status) && o.status === 'ny') {
      db.prepare("UPDATE orders SET status = 'betald' WHERE id = ?").run(o.id);
      logEvent(db, o.id, u.provider, 'Status ändrad: ny → betald', at);
    }
    return 'updated';
  });
}

export type PublicOrderStatus = { ref: string; total: number; status: OrderStatus; paymentStatus: string | null; paymentUrl: string | null };

export function getPublicOrder(ref: string, token: string): PublicOrderStatus | null {
  const o = getDb().prepare('SELECT ref, total, status, public_token, payment_status, payment_url FROM orders WHERE ref = ?').get(ref) as
    | Pick<OrderRow, 'ref' | 'total' | 'status' | 'public_token' | 'payment_status' | 'payment_url'>
    | undefined;
  if (!o || !o.public_token || o.public_token.length !== token.length) return null;
  if (!timingSafeEqual(Buffer.from(o.public_token), Buffer.from(token))) return null;
  return { ref: o.ref, total: o.total, status: o.status, paymentStatus: o.payment_status, paymentUrl: o.payment_url };
}

export function listDiscounts(): DiscountCode[] {
  return (getDb().prepare('SELECT * FROM discount_codes ORDER BY created_at DESC').all() as DiscountRow[]).map(toDiscount);
}

export type NewDiscount = { code: string; kind: DiscountKind; value: number; minTotal: number; maxUses: number | null; expiresAt: string | null };

export function createDiscount(input: NewDiscount) {
  const code = normalizeCode(input.code);
  if (input.kind === 'percent' && input.value > 100) throw new OrderError('Procentrabatt kan vara högst 100 %.');
  const db = getDb();
  if (db.prepare('SELECT 1 FROM discount_codes WHERE code = ?').get(code)) throw new OrderError('Koden finns redan.');
  db.prepare('INSERT INTO discount_codes (code, kind, value, min_total, max_uses, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(code, input.kind, input.value, input.minTotal, input.maxUses, input.expiresAt, nowIso());
}

export function setDiscountActive(id: number, active: boolean) {
  getDb().prepare('UPDATE discount_codes SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
}

export function deleteDiscount(id: number) {
  getDb().prepare('DELETE FROM discount_codes WHERE id = ?').run(id);
}
