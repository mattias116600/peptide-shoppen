// @vitest-environment node
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetDbForTests } from './db.server';
import { attachPayment, getOrder, placeOrder, updateOrder } from './shop.server';
import { mailConfig, type MailConfig } from './mail.server';
import { orderConfirmationEmail, shippingEmail, type EmailOrder } from './email-templates.server';
import { sendOrderEmail, sendShippingEmailIfReady } from './order-emails.server';

const customer = { name: 'Anna <b>Test</b>', email: 'anna@example.se', phone: '0701234567', address: 'Gatan 1', zip: '123 45', city: 'Stockholm' };

describe('config', () => {
  it('needs a sender and an SMTP host, or the outbox', () => {
    expect(mailConfig({ SMTP_HOST: 'smtp.example.com' })).toBeNull();
    expect(mailConfig({ MAIL_FROM: 'a@b.se' })).toBeNull();
    expect(mailConfig({ MAIL_FROM: 'Shop <a@b.se>', SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465', SMTP_USER: 'u', SMTP_PASS: 'p' })).toMatchObject({ kind: 'smtp', port: 465, secure: true });
    expect(mailConfig({ MAIL_FROM: 'a@b.se', SMTP_HOST: 'smtp.example.com' })).toMatchObject({ port: 587, secure: false });
    expect(mailConfig({ MAIL_FROM: 'a@b.se', MAIL_TRANSPORT: 'outbox', MAIL_OUTBOX_DIR: '/tmp/x' })).toMatchObject({ kind: 'outbox', dir: '/tmp/x' });
  });
});

describe('templates', () => {
  const order: EmailOrder = {
    ref: 'PSW-123456', ...customer, subtotal: 1798, discountCode: 'VIP15', discountAmount: 270, total: 1528, createdAt: '2026-10-17T10:00:00Z',
    lines: [{ slug: 'retatrutide-10', name: 'Retatrutide', amount: '10 mg', unitPrice: 899, qty: 2 }],
    paymentUrl: 'https://nowpayments.io/payment/?iid=1', paymentStatus: 'waiting', statusUrl: 'https://peptidesweden.com/kassa/tack?order=PSW-123456&t=x', tracking: '',
  };

  it('confirms the order with lines, discount, total, address and payment link', () => {
    const mail = orderConfirmationEmail(order);
    expect(mail.to).toBe('anna@example.se');
    expect(mail.subject).toBe('Orderbekräftelse PSW-123456 – Peptidesweden');
    // Swedish number formatting uses non-breaking spaces between thousands.
    const text = mail.text.replace(/[\u00a0\u202f]/g, ' ');
    for (const part of ['Retatrutide 10 mg × 2', '1 798 kr', 'Rabatt (VIP15)', '−270 kr', '1 528 kr', 'Gatan 1', 'https://nowpayments.io/payment/?iid=1']) expect(text).toContain(part);
    expect(mail.html).toContain('Betala ordern');
    expect(mail.html).toContain('Anna &lt;b&gt;Test&lt;/b&gt;');
    expect(mail.html).not.toContain('<b>Test</b>');
  });

  it('drops the payment button once paid', () => {
    const mail = orderConfirmationEmail({ ...order, paymentStatus: 'finished' });
    expect(mail.html).not.toContain('Betala ordern');
    expect(mail.text).toContain('Betalningen är mottagen');
    expect(mail.text.match(/Tack för din beställning/g)).toHaveLength(1);
  });

  it('includes the PostNord tracking link in the shipping email', () => {
    const mail = shippingEmail({ ...order, tracking: '00370712345678901234' });
    expect(mail.subject).toBe('Din order PSW-123456 har skickats – Peptidesweden');
    expect(mail.text).toContain('Spårningsnummer: 00370712345678901234');
    expect(mail.html).toContain('https://tracking.postnord.com/se/?id=00370712345678901234');
  });
});

describe('sending', () => {
  let dir = '';
  let outbox: MailConfig;
  beforeEach(() => {
    resetDbForTests();
    dir = mkdtempSync(path.join(tmpdir(), 'psw-mail-'));
    outbox = { kind: 'outbox', from: 'Peptidesweden <order@peptidesweden.com>', replyTo: undefined, dir };
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));
  const eml = () => readdirSync(dir).map(f => readFileSync(path.join(dir, f), 'utf8'));

  it('sends the confirmation once and records it on the order', async () => {
    const { ref } = placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 1 }]);
    attachPayment(ref, { provider: 'NOWPayments', ref: 'inv-1', url: 'https://nowpayments.io/payment/?iid=inv-1' });
    expect(await sendOrderEmail(ref, 'confirmation', 'system', { config: outbox })).toMatchObject({ sent: true });
    expect(await sendOrderEmail(ref, 'confirmation', 'system', { config: outbox })).toMatchObject({ sent: false, message: expect.stringMatching(/redan skickad/) });
    expect(eml()).toHaveLength(1);
    expect(eml()[0]).toMatch(/To: anna@example\.se/);
    expect(eml()[0]).toMatch(/nowpayments\.io\/payment/);
    const order = getOrder(ref)!;
    expect(order.emails.confirmationAt).toBeTruthy();
    expect(order.events.map(e => e.message)).toContain('Orderbekräftelse skickad till anna@example.se');
    expect(await sendOrderEmail(ref, 'confirmation', 'admin', { config: outbox, force: true })).toMatchObject({ sent: true });
    expect(eml()).toHaveLength(2);
  });

  it('logs that nothing was sent when email is not set up', async () => {
    const { ref } = placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 1 }]);
    expect(await sendOrderEmail(ref, 'confirmation', 'system', { config: null })).toMatchObject({ sent: false });
    expect(getOrder(ref)!.events[0]?.message).toMatch(/inte inställd/);
    expect(getOrder(ref)!.emails.confirmationAt).toBeNull();
  });

  it('sends the shipping email only once the order is shipped with a tracking number', async () => {
    process.env['MAIL_FROM'] = 'order@peptidesweden.com';
    process.env['MAIL_TRANSPORT'] = 'outbox';
    process.env['MAIL_OUTBOX_DIR'] = dir;
    try {
      const { ref } = placeOrder(customer, [{ slug: 'bpc-157-10', quantity: 1 }]);
      updateOrder(ref, 'admin', { status: 'skickad' });
      expect(await sendShippingEmailIfReady(ref, 'admin')).toBeNull();
      updateOrder(ref, 'admin', { tracking: 'TRACK123SE' });
      expect(await sendShippingEmailIfReady(ref, 'admin')).toMatchObject({ sent: true });
      expect(await sendShippingEmailIfReady(ref, 'admin')).toBeNull();
      expect(eml()).toHaveLength(1);
      expect(eml()[0]).toMatch(/TRACK123SE/);
    } finally {
      delete process.env['MAIL_FROM'];
      delete process.env['MAIL_TRANSPORT'];
      delete process.env['MAIL_OUTBOX_DIR'];
    }
  });
});
