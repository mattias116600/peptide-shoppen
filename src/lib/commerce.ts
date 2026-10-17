// Browser-safe order and discount rules shared by checkout, admin pages and the server.
import { products } from './products';

export const orderStatuses = ['ny', 'betald', 'skickad', 'avbruten'] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export const orderStatusLabel: Record<OrderStatus, string> = {
  ny: 'Ny – inväntar betalning',
  betald: 'Betald',
  skickad: 'Skickad',
  avbruten: 'Avbruten',
};
export const isOrderStatus = (value: unknown): value is OrderStatus => orderStatuses.includes(value as OrderStatus);

export type DiscountKind = 'percent' | 'fixed';
export type DiscountRule = {
  code: string;
  kind: DiscountKind;
  value: number;
  active: boolean;
  minTotal: number;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
};

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, '');
export const isValidCodeFormat = (code: string) => /^[A-Z0-9_-]{3,32}$/.test(code);

export type DiscountCheck = { ok: true; amount: number } | { ok: false; reason: string };

/** Whole-krona discount for a subtotal; never more than the subtotal itself. */
export function evaluateDiscount(rule: DiscountRule, subtotal: number, now = new Date()): DiscountCheck {
  if (!rule.active) return { ok: false, reason: 'Rabattkoden är inte aktiv.' };
  if (rule.expiresAt && new Date(rule.expiresAt).getTime() < now.getTime()) return { ok: false, reason: 'Rabattkoden har gått ut.' };
  if (rule.maxUses !== null && rule.uses >= rule.maxUses) return { ok: false, reason: 'Rabattkoden är förbrukad.' };
  if (subtotal < rule.minTotal) return { ok: false, reason: `Rabattkoden gäller från ${new Intl.NumberFormat('sv-SE').format(rule.minTotal)} kr.` };
  const raw = rule.kind === 'percent' ? Math.round((subtotal * rule.value) / 100) : rule.value;
  return { ok: true, amount: Math.max(0, Math.min(subtotal, raw)) };
}

export function describeDiscount(rule: Pick<DiscountRule, 'kind' | 'value'>) {
  return rule.kind === 'percent' ? `${rule.value} %` : `${new Intl.NumberFormat('sv-SE').format(rule.value)} kr`;
}

export type PricedLine = { slug: string; name: string; amount: string; unitPrice: number; qty: number };

/** Prices cart items from the catalogue so totals never depend on what the browser sends. */
export function priceLines(items: { slug: string; quantity: number }[]): PricedLine[] {
  const merged = new Map<string, number>();
  for (const item of items) merged.set(item.slug, (merged.get(item.slug) ?? 0) + item.quantity);
  const lines: PricedLine[] = [];
  for (const [slug, qty] of merged) {
    const p = products.find(product => product.slug === slug);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > 99) throw new Error('Ogiltig produkt eller antal i varukorgen.');
    lines.push({ slug, name: p.name, amount: p.amount, unitPrice: p.price, qty });
  }
  return lines;
}
export const linesSubtotal = (lines: PricedLine[]) => lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

// Statuses reported by NOWPayments for a crypto payment.
export const paymentStatusLabel: Record<string, string> = {
  waiting: 'Väntar på betalning',
  confirming: 'Bekräftas på blockkedjan',
  confirmed: 'Bekräftad',
  sending: 'Skickas till butiken',
  partially_paid: 'Delvis betald',
  finished: 'Betald',
  failed: 'Misslyckad',
  refunded: 'Återbetald',
  expired: 'Utgången',
};
/** Payment statuses that mean the full amount has been received on the blockchain. */
export const PAID_PAYMENT_STATUSES = ['confirmed', 'sending', 'finished'];
export const describePaymentStatus = (status: string | null) => (status ? paymentStatusLabel[status] ?? status : '—');

export type CustomerInput = { name: string; email: string; phone: string; address: string; zip: string; city: string };
export type PlacedOrder = CustomerInput & { ref: string; createdAt: string; subtotal: number; discountCode: string | null; discountAmount: number; total: number; lines: PricedLine[] };
export type PaymentInfo = { provider: string | null; ref: string | null; url: string | null; status: string | null };
