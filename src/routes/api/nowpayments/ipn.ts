// NOWPayments IPN (payment status callbacks). Only signed notifications that match an order's
// invoice and SEK total are applied. Any 2xx tells NOWPayments to stop retrying.
import { createFileRoute } from '@tanstack/react-router';
import { nowPaymentsConfig, parseIpn, verifyIpnSignature } from '@/server/nowpayments.server';
import { recordPaymentUpdate } from '@/server/shop.server';

export const Route = createFileRoute('/api/nowpayments/ipn')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = nowPaymentsConfig();
        if (!config) return new Response('NOWPayments is not configured', { status: 503 });
        const raw = await request.text();
        if (raw.length > 20_000) return new Response('Payload too large', { status: 413 });
        let payload: unknown;
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response('Invalid JSON', { status: 400 });
        }
        if (!verifyIpnSignature(payload as never, request.headers.get('x-nowpayments-sig'), config.ipnSecret)) {
          console.warn('NOWPayments IPN rejected: bad signature');
          return new Response('Invalid signature', { status: 401 });
        }
        const ipn = parseIpn(payload as never);
        if (!ipn) return new Response('Ignored', { status: 200 });
        const result = recordPaymentUpdate({
          provider: 'NOWPayments',
          orderRef: ipn.orderId,
          invoiceId: ipn.invoiceId,
          paymentId: ipn.paymentId,
          status: ipn.status,
          priceAmount: ipn.priceAmount,
          priceCurrency: ipn.priceCurrency,
          paidText: ipn.actuallyPaid && ipn.payCurrency ? `${ipn.actuallyPaid} ${ipn.payCurrency}` : '',
        });
        if (result !== 'updated' && result !== 'unchanged') console.warn(`NOWPayments IPN for ${ipn.orderId}: ${result}`);
        return new Response(result, { status: 200 });
      },
    },
  },
});
