import { useState } from 'react';
import { createFileRoute, Link, notFound, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Mail, Phone, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/products';
import { orderStatuses, orderStatusLabel, type OrderStatus } from '@/lib/commerce';
import { getOrderFn, updateOrderFn } from '@/lib/shop-api';
import { StatusPill, formatDateTime } from '@/components/admin/admin-ui';

export const Route = createFileRoute('/admin/ordrar/$ref')({
  loader: async ({ params }) => {
    const order = await getOrderFn({ data: { ref: params.ref } });
    if (!order) throw notFound();
    return order;
  },
  notFoundComponent: () => (
    <main className="admin-page"><p className="admin-empty">Ordern finns inte.</p><Button asChild variant="outline"><Link to="/admin"><ArrowLeft /> Till ordrar</Link></Button></main>
  ),
  component: OrderPage,
});

function OrderPage() {
  const order = Route.useLoaderData();
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [tracking, setTracking] = useState(order.tracking);
  const [note, setNote] = useState(order.adminNote);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = status !== order.status || tracking !== order.tracking || note !== order.adminNote;

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await updateOrderFn({ data: { ref: order.ref, status, tracking, adminNote: note } });
      if (!result.ok) { setMessage({ kind: 'error', text: result.error }); return; }
      await router.invalidate();
      setMessage({ kind: 'ok', text: 'Ändringarna är sparade.' });
    } catch {
      setMessage({ kind: 'error', text: 'Kunde inte spara. Försök igen.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-page">
      <Link to="/admin" className="admin-back"><ArrowLeft size={15} /> Alla ordrar</Link>
      <div className="admin-heading">
        <h1>{order.ref}</h1>
        <StatusPill status={order.status} />
        <p className="admin-muted">Lagd {formatDateTime(order.createdAt)} · senast ändrad {formatDateTime(order.updatedAt)}</p>
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <h2>Artiklar</h2>
          <table className="admin-table admin-table-compact">
            <thead><tr><th>Produkt</th><th>Antal</th><th>À-pris</th><th>Summa</th></tr></thead>
            <tbody>
              {order.lines.map(l => (
                <tr key={l.slug}><td>{l.name} {l.amount}</td><td>{l.qty}</td><td>{formatPrice(l.unitPrice)}</td><td>{formatPrice(l.unitPrice * l.qty)}</td></tr>
              ))}
            </tbody>
          </table>
          <dl className="admin-totals">
            <div><dt>Delsumma</dt><dd>{formatPrice(order.subtotal)}</dd></div>
            {order.discountCode && <div><dt>Rabatt ({order.discountCode})</dt><dd>−{formatPrice(order.discountAmount)}</dd></div>}
            <div className="admin-totals-sum"><dt>Totalt</dt><dd>{formatPrice(order.total)}</dd></div>
          </dl>
        </section>

        <section className="admin-card">
          <h2>Kund och leverans</h2>
          <p className="admin-address">{order.name}<br />{order.address}<br />{order.zip} {order.city}</p>
          <p className="admin-contact"><Mail size={14} /> <a href={`mailto:${order.email}`}>{order.email}</a></p>
          <p className="admin-contact"><Phone size={14} /> <a href={`tel:${order.phone}`}>{order.phone}</a></p>
        </section>

        <section className="admin-card">
          <h2>Hantera order</h2>
          <label className="kassa-field"><span>Status</span>
            <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)}>
              {orderStatuses.map(s => <option key={s} value={s}>{orderStatusLabel[s]}</option>)}
            </select>
          </label>
          <label className="kassa-field"><span>PostNord spårningsnummer</span>
            <input value={tracking} maxLength={60} onChange={e => setTracking(e.target.value)} placeholder="t.ex. 00370712345678901234" />
          </label>
          <label className="kassa-field"><span>Intern anteckning</span>
            <textarea value={note} maxLength={2000} rows={4} onChange={e => setNote(e.target.value)} placeholder="Syns bara för admin" />
          </label>
          {message && <p className={message.kind === 'ok' ? 'admin-success' : 'kassa-error'} role="status">{message.text}</p>}
          <Button onClick={save} disabled={!dirty || busy}><Save /> {busy ? 'Sparar…' : 'Spara ändringar'}</Button>
        </section>

        <section className="admin-card">
          <h2>Historik</h2>
          <ol className="admin-events">
            {order.events.map((ev, i) => (
              <li key={i}><time>{formatDateTime(ev.at)}</time><span>{ev.message}</span><em>{ev.actor}</em></li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
