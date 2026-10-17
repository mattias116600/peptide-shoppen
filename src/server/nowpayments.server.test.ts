// @vitest-environment node
import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInvoice, nowPaymentsConfig, parseIpn, signIpn, verifyIpnSignature } from './nowpayments.server';
import { resetDbForTests } from './db.server';
import { attachPayment, cancelUnstartedOrder, createDiscount, getOrder, getPublicOrder, listDiscounts, placeOrder, recordPaymentUpdate } from './shop.server';

const config = { apiKey: 'key', ipnSecret: 'secret', siteUrl: 'https://peptidesweden.com', apiUrl: 'https://api.nowpayments.io/v1' };
const customer = { name: 'Test', email: 't@example.se', phone: '0701234567', address: 'Gatan 1', zip: '12345', city: 'Sthlm' };

describe('config', () => {
  it('is off until all three values are set', () => {
    expect(nowPaymentsConfig({ NOWPAYMENTS_API_KEY: 'k', NOWPAYMENTS_IPN_SECRET: 's' })).toBeNull();
    expect(nowPaymentsConfig({ NOWPAYMENTS_API_KEY: 'k', NOWPAYMENTS_IPN_SECRET: 's', PUBLIC_SITE_URL: 'https://x.se/' })).toMatchObject({ siteUrl: 'https://x.se', apiUrl: 'https://api.nowpayments.io/v1' });
  });
});

describe('createInvoice', () => {
  it('posts the SEK total with return and callback URLs', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 4522625843, invoice_url: 'https://nowpayments.io/payment/?iid=4522625843' }), { status: 200 }));
    const invoice = await createInvoice(config, { ref: 'PSW-123456', total: 1528, publicToken: 'tok' }, fetchMock as unknown as typeof fetch);
    expect(invoice).toEqual({ id: '4522625843', url: 'https://nowpayments.io/payment/?iid=4522625843' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.nowpayments.io/v1/invoice');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('key');
    expect(JSON.parse(init.body as string)).toMatchObject({
      price_amount: 1528, price_currency: 'sek', order_id: 'PSW-123456',
      ipn_callback_url: 'https://peptidesweden.com/api/nowpayments/ipn',
      success_url: 'https://peptidesweden.com/kassa/tack?order=PSW-123456&t=tok&betalning=klar',
    });
  });

  it('throws on API errors', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ message: 'Invalid api key' }), { status: 403 }));
    await expect(createInvoice(config, { ref: 'PSW-1', total: 1, publicToken: 't' }, fetchMock as unknown as typeof fetch)).rejects.toThrow(/403.*Invalid api key/);
  });
});

describe('IPN signature', () => {
  const payload = { payment_id: 5524759814, payment_status: 'finished', price_amount: 1528, price_currency: 'sek', order_id: 'PSW-1', invoice_id: 42, fee: { serviceFee: 0, currency: 'btc' }, payment_extra_ids: [1, 2] };

  it('matches the documented Node example', () => {
    const sortObject = (obj: Record<string, unknown>): Record<string, unknown> =>
      Object.keys(obj).sort().reduce<Record<string, unknown>>((r, k) => { const v = obj[k]; r[k] = v && typeof v === 'object' ? sortObject(v as Record<string, unknown>) : v; return r; }, {});
    const expected = createHmac('sha512', 'secret').update(JSON.stringify(sortObject(payload))).digest('hex');
    expect(signIpn(payload, 'secret')).toBe(expected);
    expect(verifyIpnSignature(payload, expected, 'secret')).toBe(true);
  });

  it('also accepts the array-preserving form and rejects tampering', () => {
    const pythonStyle = createHmac('sha512', 'secret').update(JSON.stringify({ fee: { currency: 'btc', serviceFee: 0 }, invoice_id: 42, order_id: 'PSW-1', payment_extra_ids: [1, 2], payment_id: 5524759814, payment_status: 'finished', price_amount: 1528, price_currency: 'sek' })).digest('hex');
    expect(verifyIpnSignature(payload, pythonStyle, 'secret')).toBe(true);
    expect(verifyIpnSignature({ ...payload, price_amount: 1 }, pythonStyle, 'secret')).toBe(false);
    expect(verifyIpnSignature(payload, signIpn(payload, 'other'), 'secret')).toBe(false);
    expect(verifyIpnSignature(payload, undefined, 'secret')).toBe(false);
  });

  it('parses the fields the shop needs', () => {
    expect(parseIpn({ ...payload, actually_paid: 0.0021, pay_currency: 'btc' })).toMatchObject({ orderId: 'PSW-1', invoiceId: '42', status: 'finished', priceAmount: 1528, priceCurrency: 'sek', payCurrency: 'BTC' });
    expect(parseIpn({ id: 'withdrawal' })).toBeNull();
  });
});

describe('payment updates', () => {
  beforeEach(() => resetDbForTests());
  const update = (ref: string, status: string, extra: Partial<Parameters<typeof recordPaymentUpdate>[0]> = {}) =>
    recordPaymentUpdate({ provider: 'NOWPayments', orderRef: ref, invoiceId: 'inv-1', paymentId: 'p1', status, priceAmount: 399, priceCurrency: 'sek', paidText: '0.0004 BTC', ...extra });

  it('marks the order paid once the payment is confirmed', () => {
    const { ref } = placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 1 }]);
    attachPayment(ref, { provider: 'NOWPayments', ref: 'inv-1', url: 'https://nowpayments.io/payment/?iid=inv-1' });
    expect(update(ref, 'confirming')).toBe('updated');
    expect(getOrder(ref)?.status).toBe('ny');
    expect(update(ref, 'finished')).toBe('updated');
    expect(update(ref, 'finished')).toBe('unchanged');
    expect(update(ref, 'confirming')).toBe('unchanged');
    const order = getOrder(ref)!;
    expect(order.status).toBe('betald');
    expect(order.payment).toMatchObject({ provider: 'NOWPayments', status: 'finished', ref: 'inv-1' });
  });

  it('rejects notifications for another amount, currency or invoice', () => {
    const { ref } = placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 1 }]);
    attachPayment(ref, { provider: 'NOWPayments', ref: 'inv-1', url: 'u' });
    expect(update(ref, 'finished', { priceAmount: 1 })).toBe('mismatch');
    expect(update(ref, 'finished', { priceCurrency: 'usd' })).toBe('mismatch');
    expect(update(ref, 'finished', { invoiceId: 'inv-2' })).toBe('mismatch');
    expect(update('PSW-000000', 'finished')).toBe('unknown-order');
    expect(getOrder(ref)?.status).toBe('ny');
  });

  it('only shows the order to someone with its token', () => {
    const { ref, publicToken } = placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 1 }]);
    expect(getPublicOrder(ref, publicToken)).toMatchObject({ ref, total: 399, status: 'ny' });
    expect(getPublicOrder(ref, 'x'.repeat(publicToken.length))).toBeNull();
  });

  it('cancels an order whose payment never started and returns the discount use', () => {
    createDiscount({ code: 'ONCE', kind: 'fixed', value: 50, minTotal: 0, maxUses: 1, expiresAt: null });
    const { ref } = placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 1 }], 'ONCE');
    expect(listDiscounts()[0]?.uses).toBe(1);
    cancelUnstartedOrder(ref, 'test');
    expect(getOrder(ref)?.status).toBe('avbruten');
    expect(listDiscounts()[0]?.uses).toBe(0);
  });
});
