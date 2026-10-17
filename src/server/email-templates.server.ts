// Customer emails: order confirmation and shipping notice. Plain text plus simple inline-styled HTML,
// since email clients ignore stylesheets. Every customer-supplied value is escaped.
import { formatPrice, shippingInfo, supportInfo } from '@/lib/products';
import { PAID_PAYMENT_STATUSES, type PricedLine } from '@/lib/commerce';
import type { MailMessage } from './mail.server';

export type EmailOrder = {
  ref: string; name: string; email: string; phone: string; address: string; zip: string; city: string;
  subtotal: number; discountCode: string | null; discountAmount: number; total: number; lines: PricedLine[];
  createdAt: string; paymentUrl: string | null; paymentStatus: string | null; statusUrl: string | null; tracking: string;
};

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export const postnordTrackingUrl = (tracking: string) => `https://tracking.postnord.com/se/?id=${encodeURIComponent(tracking)}`;
const researchNote = 'Alla produkter säljs endast för laboratorieforskning. Ej för användning på människor eller djur.';

function layout(title: string, body: string) {
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f4f6fa;font-family:Helvetica,Arial,sans-serif;color:#1f2533">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e3e7ef">
<tr><td style="padding:22px 28px;border-bottom:1px solid #e3e7ef;font-size:20px;font-weight:700">peptide<span style="color:#1d4fd8">sweden</span></td></tr>
<tr><td style="padding:28px">${body}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #e3e7ef;font-size:12px;line-height:1.5;color:#6b7385">
Frågor? Skriv till oss på Telegram: <a href="${supportInfo.url}" style="color:#1d4fd8">${esc(supportInfo.handle)}</a><br>${esc(researchNote)}</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:22px 0"><a href="${esc(href)}" style="display:inline-block;background:#1d4fd8;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px">${esc(label)}</a></p>`;

function linesHtml(o: EmailOrder) {
  const row = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 0;${bold ? 'font-weight:700;border-top:1px solid #e3e7ef;padding-top:12px' : ''}">${label}</td><td align="right" style="padding:6px 0;white-space:nowrap;${bold ? 'font-weight:700;border-top:1px solid #e3e7ef;padding-top:12px;color:#1d4fd8' : ''}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:8px 0 4px">
${o.lines.map(l => row(`${esc(l.name)} ${esc(l.amount)} × ${l.qty}`, esc(formatPrice(l.unitPrice * l.qty)))).join('')}
${o.discountCode ? row(`Rabatt (${esc(o.discountCode)})`, `−${esc(formatPrice(o.discountAmount))}`) : ''}
${row('Totalt', esc(formatPrice(o.total)), true)}</table>`;
}

const linesText = (o: EmailOrder) =>
  [...o.lines.map(l => `${l.name} ${l.amount} × ${l.qty}: ${formatPrice(l.unitPrice * l.qty)}`),
    ...(o.discountCode ? [`Rabatt (${o.discountCode}): −${formatPrice(o.discountAmount)}`] : []),
    `Totalt: ${formatPrice(o.total)}`].join('\n');

const addressHtml = (o: EmailOrder) => `${esc(o.name)}<br>${esc(o.address)}<br>${esc(o.zip)} ${esc(o.city)}<br>${esc(o.phone)}`;
const addressText = (o: EmailOrder) => `${o.name}\n${o.address}\n${o.zip} ${o.city}\n${o.phone}`;

export function orderConfirmationEmail(o: EmailOrder): MailMessage {
  const paid = PAID_PAYMENT_STATUSES.includes(o.paymentStatus ?? '');
  const needsPayment = !paid && !!o.paymentUrl;
  const intro = paid
    ? 'Betalningen är mottagen och vi packar din order.'
    : needsPayment
      ? 'Vi skickar ordern så snart betalningen är bekräftad. Har du inte betalat ännu kan du göra det via knappen nedan.'
      : 'Vi återkommer med betalningsinstruktioner. Ordern skickas när betalningen har kommit in.';
  const firstName = o.name.split(' ')[0] || o.name;
  const subject = `Orderbekräftelse ${o.ref} – Peptidesweden`;
  const html = layout(subject, `
<h1 style="margin:0 0 6px;font-size:22px">Tack för din beställning</h1>
<p style="margin:0 0 18px;color:#6b7385;font-size:13px">Ordernummer <strong style="color:#1f2533">${esc(o.ref)}</strong></p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.55">Hej ${esc(firstName)}! ${esc(intro)}</p>
${needsPayment ? button(o.paymentUrl!, 'Betala ordern') : ''}
<h2 style="margin:22px 0 4px;font-size:16px">Din beställning</h2>${linesHtml(o)}
<h2 style="margin:22px 0 6px;font-size:16px">Leveransadress</h2>
<p style="margin:0;font-size:14px;line-height:1.55">${addressHtml(o)}</p>
<p style="margin:16px 0 0;font-size:14px;line-height:1.55">${esc(shippingInfo.summary)} Du får ett nytt mejl med spårningsnummer när paketet har skickats.</p>
${o.statusUrl ? `<p style="margin:16px 0 0;font-size:14px"><a href="${esc(o.statusUrl)}" style="color:#1d4fd8">Se orderstatus</a></p>` : ''}`);
  const text = [
    `Hej ${firstName}!`, '', `Tack för din beställning. Ordernummer: ${o.ref}`, intro,
    ...(needsPayment ? ['', `Betala här: ${o.paymentUrl}`] : []),
    '', 'DIN BESTÄLLNING', linesText(o), '', 'LEVERANSADRESS', addressText(o), '',
    `${shippingInfo.summary} Du får ett nytt mejl med spårningsnummer när paketet har skickats.`,
    ...(o.statusUrl ? ['', `Orderstatus: ${o.statusUrl}`] : []),
    '', `Frågor? Telegram: ${supportInfo.handle} (${supportInfo.url})`, researchNote,
  ].join('\n');
  return { to: o.email, subject, text, html };
}

export function shippingEmail(o: EmailOrder): MailMessage {
  const subject = `Din order ${o.ref} har skickats – Peptidesweden`;
  const tracking = o.tracking.trim();
  const html = layout(subject, `
<h1 style="margin:0 0 6px;font-size:22px">Din order är på väg</h1>
<p style="margin:0 0 18px;color:#6b7385;font-size:13px">Ordernummer <strong style="color:#1f2533">${esc(o.ref)}</strong></p>
<p style="margin:0 0 10px;font-size:15px;line-height:1.55">Hej ${esc(o.name.split(' ')[0] ?? o.name)}! Ditt paket har lämnats till ${esc(shippingInfo.carrier)} och levereras normalt inom ${esc(shippingInfo.leadTime)}.</p>
${tracking ? `<p style="margin:14px 0 0;font-size:15px">Spårningsnummer: <strong>${esc(tracking)}</strong></p>${button(postnordTrackingUrl(tracking), 'Spåra paketet hos PostNord')}` : ''}
<h2 style="margin:22px 0 6px;font-size:16px">Levereras till</h2>
<p style="margin:0;font-size:14px;line-height:1.55">${addressHtml(o)}</p>
<h2 style="margin:22px 0 4px;font-size:16px">Innehåll</h2>${linesHtml(o)}`);
  const text = [
    'Din order är på väg!', `Ordernummer: ${o.ref}`, '',
    `Ditt paket har lämnats till ${shippingInfo.carrier} och levereras normalt inom ${shippingInfo.leadTime}.`,
    ...(tracking ? ['', `Spårningsnummer: ${tracking}`, `Spåra paketet: ${postnordTrackingUrl(tracking)}`] : []),
    '', 'LEVERERAS TILL', addressText(o), '', 'INNEHÅLL', linesText(o), '',
    `Frågor? Telegram: ${supportInfo.handle} (${supportInfo.url})`, researchNote,
  ].join('\n');
  return { to: o.email, subject, text, html };
}
