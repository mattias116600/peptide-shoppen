// NOWPayments crypto checkout: hosted invoices plus signed IPN callbacks.
// Docs: https://documenter.getpostman.com/view/7907941/2s93JusNJt
import { createHmac, timingSafeEqual } from 'node:crypto';

export type NowPaymentsConfig = { apiKey: string; ipnSecret: string; siteUrl: string; apiUrl: string };

/** Null when the keys are not set, so checkout falls back to orders that are paid manually. */
export function nowPaymentsConfig(env: Record<string, string | undefined> = process.env): NowPaymentsConfig | null {
  const apiKey = env['NOWPAYMENTS_API_KEY']?.trim();
  const ipnSecret = env['NOWPAYMENTS_IPN_SECRET']?.trim();
  const siteUrl = env['PUBLIC_SITE_URL']?.trim().replace(/\/+$/, '');
  if (!apiKey || !ipnSecret || !siteUrl) return null;
  return { apiKey, ipnSecret, siteUrl, apiUrl: (env['NOWPAYMENTS_API_URL']?.trim() || 'https://api.nowpayments.io/v1').replace(/\/+$/, '') };
}

export type Invoice = { id: string; url: string };

export async function createInvoice(
  config: NowPaymentsConfig,
  order: { ref: string; total: number; publicToken: string },
  fetchImpl: typeof fetch = fetch,
): Promise<Invoice> {
  const back = (state: string) => `${config.siteUrl}/kassa/tack?order=${encodeURIComponent(order.ref)}&t=${encodeURIComponent(order.publicToken)}&betalning=${state}`;
  const response = await fetchImpl(`${config.apiUrl}/invoice`, {
    method: 'POST',
    headers: { 'x-api-key': config.apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      price_amount: order.total,
      price_currency: 'sek',
      order_id: order.ref,
      order_description: `Peptidesweden order ${order.ref}`,
      ipn_callback_url: `${config.siteUrl}/api/nowpayments/ipn`,
      success_url: back('klar'),
      cancel_url: back('avbruten'),
      partially_paid_url: back('delvis'),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => ({}))) as { id?: unknown; invoice_url?: unknown; message?: unknown };
  if (!response.ok || !body.id || typeof body.invoice_url !== 'string') {
    throw new Error(`NOWPayments invoice failed (${response.status}): ${typeof body.message === 'string' ? body.message : 'unexpected response'}`);
  }
  return { id: String(body.id), url: body.invoice_url };
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

// NOWPayments' Node example sorts nested objects and turns arrays into index-keyed objects,
// while its Python example keeps arrays. Accept a signature over either form.
function sortLikeNodeExample(value: Json): Json {
  if (!value || typeof value !== 'object') return value;
  const obj = value as Record<string, Json>;
  return Object.keys(obj).sort().reduce<Record<string, Json>>((out, key) => {
    const v = obj[key] ?? null;
    out[key] = v && typeof v === 'object' ? sortLikeNodeExample(v) : v;
    return out;
  }, {});
}
function sortKeepingArrays(value: Json): Json {
  if (Array.isArray(value)) return value.map(sortKeepingArrays);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce<Record<string, Json>>((out, key) => {
    out[key] = sortKeepingArrays(value[key] ?? null);
    return out;
  }, {});
}

export function signIpn(payload: Json, secret: string, canonical: (v: Json) => Json = sortLikeNodeExample) {
  return createHmac('sha512', secret).update(JSON.stringify(canonical(payload))).digest('hex');
}

export function verifyIpnSignature(payload: Json, signature: string | null | undefined, secret: string) {
  if (!signature || !/^[0-9a-f]{128}$/i.test(signature)) return false;
  const given = Buffer.from(signature.toLowerCase(), 'hex');
  return [sortLikeNodeExample, sortKeepingArrays].some(canonical => timingSafeEqual(Buffer.from(signIpn(payload, secret, canonical), 'hex'), given));
}

export type IpnPayment = {
  paymentId: string;
  invoiceId: string | null;
  orderId: string;
  status: string;
  priceAmount: number;
  priceCurrency: string;
  actuallyPaid: string;
  payCurrency: string;
};

export function parseIpn(payload: Json): IpnPayment | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const p = payload as Record<string, Json>;
  if (typeof p['order_id'] !== 'string' || typeof p['payment_status'] !== 'string') return null;
  return {
    paymentId: String(p['payment_id'] ?? ''),
    invoiceId: p['invoice_id'] === null || p['invoice_id'] === undefined ? null : String(p['invoice_id']),
    orderId: p['order_id'],
    status: p['payment_status'],
    priceAmount: Number(p['price_amount']),
    priceCurrency: String(p['price_currency'] ?? '').toLowerCase(),
    actuallyPaid: String(p['actually_paid'] ?? ''),
    payCurrency: String(p['pay_currency'] ?? '').toUpperCase(),
  };
}
