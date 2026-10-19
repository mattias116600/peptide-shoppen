// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { resetDbForTests, getDb } from './db.server';
import { createDiscount, getOrder, listOrders, orderStats, placeOrder, quoteDiscount, setDiscountActive, updateOrder, listDiscounts } from './shop.server';
import { checkCredentials, createSession, destroySession, hashPassword, loginLockMinutes, recordLoginFailure, sessionAdmin, verifyPassword } from './auth.server';
import { evaluateDiscount } from '@/lib/commerce';

const customer = { name: 'Test Testsson', email: 'test@example.se', phone: '0701234567', address: 'Gatan 1', zip: '123 45', city: 'Stockholm' };

beforeEach(() => resetDbForTests());

describe('orders', () => {
  it('prices orders from the catalogue, not from the client', () => {
    const order = placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 2 }, { slug: 'ghk-cu-50', quantity: 1 }]);
    expect(order.subtotal).toBe(399 * 2 + 399);
    expect(order.shipping).toBe(62);
    expect(order.total).toBe(order.subtotal + 62);
    expect(order.ref).toMatch(/^PSW-\d{6}$/);
    expect(getOrder(order.ref)?.lines).toHaveLength(2);
  });

  it('ships free from 2 000 kr after discount', () => {
    expect(placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 5 }])).toMatchObject({ subtotal: 1995, shipping: 62, total: 2057 });
    expect(placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 6 }])).toMatchObject({ subtotal: 2394, shipping: 0, total: 2394 });
    createDiscount({ code: 'HALV', kind: 'percent', value: 50, minTotal: 0, maxUses: null, expiresAt: null });
    expect(placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 6 }], 'HALV')).toMatchObject({ discountAmount: 1197, shipping: 62, total: 1259 });
  });

  it('rejects unknown products', () => {
    expect(() => placeOrder(customer, [{ slug: 'nope', quantity: 1 }])).toThrow(/Ogiltig/);
  });

  it('applies a discount code and counts the use', () => {
    createDiscount({ code: 'sommar10', kind: 'percent', value: 10, minTotal: 0, maxUses: 1, expiresAt: null });
    expect(quoteDiscount(' Sommar10 ', [{ slug: 'retatrutide-10', quantity: 1 }])).toMatchObject({ code: 'SOMMAR10', amount: 90, shipping: 62, total: 871 });
    const order = placeOrder(customer, [{ slug: 'retatrutide-10', quantity: 1 }], 'SOMMAR10');
    expect(order).toMatchObject({ discountCode: 'SOMMAR10', discountAmount: 90, shipping: 62, total: 871 });
    expect(listDiscounts()[0]?.uses).toBe(1);
    expect(() => placeOrder(customer, [{ slug: 'retatrutide-10', quantity: 1 }], 'SOMMAR10')).toThrow(/förbrukad/);
  });

  it('rolls back the discount use when the order fails', () => {
    createDiscount({ code: 'MIN', kind: 'fixed', value: 100, minTotal: 1000, maxUses: null, expiresAt: null });
    expect(() => placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 1 }], 'MIN')).toThrow(/gäller från/);
    expect(listDiscounts()[0]?.uses).toBe(0);
    setDiscountActive(listDiscounts()[0]!.id, false);
    expect(() => quoteDiscount('MIN', [{ slug: 'retatrutide-60', quantity: 1 }])).toThrow(/inte aktiv/);
  });

  it('updates status, tracking and logs history', () => {
    const { ref } = placeOrder(customer, [{ slug: 'mots-c-40', quantity: 1 }]);
    updateOrder(ref, 'admin', { status: 'skickad', tracking: 'ABC123' });
    const order = getOrder(ref)!;
    expect(order.status).toBe('skickad');
    expect(order.tracking).toBe('ABC123');
    expect(order.events.map(e => e.message)).toEqual(expect.arrayContaining(['Status ändrad: ny → skickad', 'Spårningsnummer: ABC123']));
    expect(orderStats()).toMatchObject({ revenue: 649 + 62, byStatus: { skickad: 1 } });
    expect(listOrders({ q: 'testsson' }).total).toBe(1);
    expect(listOrders({ status: 'ny' }).total).toBe(0);
  });
});

describe('discount rules', () => {
  const base = { code: 'X', kind: 'fixed' as const, value: 500, active: true, minTotal: 0, maxUses: null, uses: 0, expiresAt: null };
  it('never discounts more than the subtotal', () => expect(evaluateDiscount(base, 300)).toEqual({ ok: true, amount: 300 }));
  it('rejects expired codes', () => expect(evaluateDiscount({ ...base, expiresAt: '2020-01-01T00:00:00Z' }, 300).ok).toBe(false));
});

describe('admin auth', () => {
  it('hashes passwords and verifies them', () => {
    const hash = hashPassword('korrekt-hast-batteri');
    expect(hash).not.toContain('korrekt');
    expect(verifyPassword('korrekt-hast-batteri', hash)).toBe(true);
    expect(verifyPassword('fel', hash)).toBe(false);
  });

  it('issues and revokes sessions', () => {
    getDb().prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('mattias', hashPassword('ett-langt-losenord'));
    expect(checkCredentials('mattias', 'fel')).toBeNull();
    expect(checkCredentials('okand', 'ett-langt-losenord')).toBeNull();
    const admin = checkCredentials('Mattias', 'ett-langt-losenord');
    expect(admin?.username).toBe('mattias');
    const { token } = createSession(admin!.id);
    expect(sessionAdmin(token)?.username).toBe('mattias');
    expect(getDb().prepare('SELECT token_hash FROM sessions').get()).not.toMatchObject({ token_hash: token });
    destroySession(token);
    expect(sessionAdmin(token)).toBeNull();
    expect(sessionAdmin('made-up')).toBeNull();
  });

  it('locks out after repeated failures', () => {
    const keys = ['ip:test-lock'];
    const t = Date.now();
    for (let i = 0; i < 5; i++) recordLoginFailure(keys, t);
    expect(loginLockMinutes(keys, t)).toBe(15);
    expect(loginLockMinutes(keys, t + 16 * 60_000)).toBe(0);
  });
});
