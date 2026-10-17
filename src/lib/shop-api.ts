// Server functions for checkout and the admin area. Handlers run only on the server;
// every admin function checks the session itself rather than trusting the route guard.
import { createServerFn } from '@tanstack/react-start';
import { deleteCookie, getCookie, getRequestHeader, getRequestIP, setCookie } from '@tanstack/react-start/server';
import { z } from 'zod';
import { orderStatuses } from './commerce';
import { isValidPhone, normalizePhone } from './products';
import {
  checkCredentials, clearLoginFailures, createSession, destroySession, loginLockMinutes, recordLoginFailure, sessionAdmin,
} from '@/server/auth.server';
import {
  OrderError, attachPayment, cancelUnstartedOrder, createDiscount, deleteDiscount, getOrder, getPublicOrder, listDiscounts, listOrders, orderStats, placeOrder,
  quoteDiscount, setDiscountActive, updateOrder,
} from '@/server/shop.server';
import { createInvoice, nowPaymentsConfig } from '@/server/nowpayments.server';

const COOKIE = 'psw_admin';

// Nginx overwrites X-Real-IP with the connecting address; the app itself only listens on 127.0.0.1.
const clientIp = () => getRequestHeader('x-real-ip') ?? getRequestIP() ?? 'unknown';

function requireAdmin() {
  const admin = sessionAdmin(getCookie(COOKIE));
  if (!admin) throw new Error('Inte inloggad.');
  return admin;
}

/** Turns expected business errors into a result the UI can show instead of a 500. */
function attempt<T>(fn: () => T): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: fn() };
  } catch (error) {
    if (error instanceof OrderError || (error instanceof Error && error.message.startsWith('Ogiltig'))) return { ok: false, error: error.message };
    throw error;
  }
}

const cartSchema = z.array(z.object({ slug: z.string().max(80), quantity: z.number().int().min(1).max(99) })).min(1).max(40);
const customerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().max(25).transform(normalizePhone).refine(isValidPhone, 'Ogiltigt telefonnummer'),
  address: z.string().trim().min(1).max(160),
  zip: z.string().trim().min(3).max(12),
  city: z.string().trim().min(1).max(80),
});
const codeSchema = z.string().trim().max(32);

// Simple per-IP limit so the public order endpoint cannot be flooded.
const orderHits = new Map<string, number[]>();
function allowOrder(ip: string, now = Date.now()) {
  const hits = (orderHits.get(ip) ?? []).filter(t => now - t < 10 * 60_000);
  if (hits.length >= 10) return false;
  orderHits.set(ip, [...hits, now]);
  return true;
}

// ---------- Checkout ----------

export const checkDiscountFn = createServerFn({ method: 'POST' })
  .validator(z.object({ code: codeSchema, cart: cartSchema }))
  .handler(({ data }) => attempt(() => quoteDiscount(data.code, data.cart)));

export const getCheckoutConfigFn = createServerFn({ method: 'GET' }).handler(() => ({ cryptoPayments: nowPaymentsConfig() !== null }));

export const placeOrderFn = createServerFn({ method: 'POST' })
  .validator(z.object({ customer: customerSchema, cart: cartSchema, discountCode: codeSchema.optional() }))
  .handler(async ({ data }) => {
    if (!allowOrder(clientIp())) return { ok: false as const, error: 'För många beställningar på kort tid. Försök igen om en stund.' };
    const placed = attempt(() => placeOrder(data.customer, data.cart, data.discountCode));
    if (!placed.ok) return placed;
    const { publicToken, ...order } = placed.value;
    const config = nowPaymentsConfig();
    // Without NOWPayments keys (e.g. in the Lovable editor) orders are stored and marked paid by hand in /admin.
    if (!config) return { ok: true as const, value: { order, paymentUrl: null } };
    try {
      const invoice = await createInvoice(config, { ref: order.ref, total: order.total, publicToken });
      attachPayment(order.ref, { provider: 'NOWPayments', ref: invoice.id, url: invoice.url });
      return { ok: true as const, value: { order, paymentUrl: invoice.url } };
    } catch (error) {
      console.error(error);
      cancelUnstartedOrder(order.ref, 'betalningen kunde inte startas hos NOWPayments');
      return { ok: false as const, error: 'Betalningen kunde inte startas just nu. Försök igen om en stund eller kontakta oss på Telegram.' };
    }
  });

export const getPublicOrderFn = createServerFn({ method: 'GET' })
  .validator(z.object({ ref: z.string().max(20), token: z.string().max(64) }))
  .handler(({ data }) => getPublicOrder(data.ref, data.token));

// ---------- Session ----------

export const getAdminFn = createServerFn({ method: 'GET' }).handler(() => sessionAdmin(getCookie(COOKIE)));

export const loginFn = createServerFn({ method: 'POST' })
  .validator(z.object({ username: z.string().trim().min(1).max(64), password: z.string().min(1).max(200) }))
  .handler(({ data }) => {
    const keys = [`ip:${clientIp()}`];
    const locked = loginLockMinutes(keys);
    if (locked) return { ok: false as const, error: `För många misslyckade försök. Försök igen om ${locked} min.` };
    const admin = checkCredentials(data.username, data.password);
    if (!admin) {
      recordLoginFailure(keys);
      return { ok: false as const, error: 'Fel användarnamn eller lösenord.' };
    }
    clearLoginFailures(keys);
    const { token, expires } = createSession(admin.id);
    setCookie(COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: process.env['NODE_ENV'] === 'production', path: '/', expires });
    return { ok: true as const, username: admin.username };
  });

export const logoutFn = createServerFn({ method: 'POST' }).handler(() => {
  destroySession(getCookie(COOKIE));
  deleteCookie(COOKIE, { path: '/' });
  return { ok: true };
});

// ---------- Orders ----------

export const listOrdersFn = createServerFn({ method: 'GET' })
  .validator(z.object({ status: z.enum(orderStatuses).optional(), q: z.string().max(100).optional(), page: z.number().int().min(1).max(10000).default(1) }))
  .handler(({ data }) => {
    requireAdmin();
    const limit = 50;
    return { ...listOrders({ status: data.status, q: data.q, limit, offset: (data.page - 1) * limit }), limit, stats: orderStats() };
  });

export const getOrderFn = createServerFn({ method: 'GET' })
  .validator(z.object({ ref: z.string().max(20) }))
  .handler(({ data }) => {
    requireAdmin();
    return getOrder(data.ref);
  });

export const updateOrderFn = createServerFn({ method: 'POST' })
  .validator(z.object({ ref: z.string().max(20), status: z.enum(orderStatuses).optional(), tracking: z.string().max(60).optional(), adminNote: z.string().max(2000).optional() }))
  .handler(({ data }) => {
    const admin = requireAdmin();
    return attempt(() => updateOrder(data.ref, admin.username, data));
  });

// ---------- Discount codes ----------

export const listDiscountsFn = createServerFn({ method: 'GET' }).handler(() => {
  requireAdmin();
  return listDiscounts();
});

export const createDiscountFn = createServerFn({ method: 'POST' })
  .validator(z.object({
    code: z.string().trim().regex(/^[A-Za-z0-9_-]{3,32}$/, 'Koden får bara innehålla A–Z, 0–9, - och _ (3–32 tecken).'),
    kind: z.enum(['percent', 'fixed']),
    value: z.number().int().min(1).max(100000),
    minTotal: z.number().int().min(0).max(1000000),
    maxUses: z.number().int().min(1).max(1000000).nullable(),
    expiresAt: z.string().datetime().nullable(),
  }))
  .handler(({ data }) => {
    requireAdmin();
    return attempt(() => createDiscount(data));
  });

export const setDiscountActiveFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.number().int(), active: z.boolean() }))
  .handler(({ data }) => {
    requireAdmin();
    setDiscountActive(data.id, data.active);
    return { ok: true };
  });

export const deleteDiscountFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.number().int() }))
  .handler(({ data }) => {
    requireAdmin();
    deleteDiscount(data.id);
    return { ok: true };
  });
