import { useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/products';
import { isOrderStatus, orderStatuses, orderStatusLabel, type OrderStatus } from '@/lib/commerce';
import { listOrdersFn } from '@/lib/shop-api';
import { StatusPill, formatDateTime } from '@/components/admin/admin-ui';

type OrderSearch = { status?: OrderStatus | undefined; q?: string | undefined; page?: number | undefined };

export const Route = createFileRoute('/admin/')({
  validateSearch: (search: Record<string, unknown>): OrderSearch => ({
    status: isOrderStatus(search['status']) ? search['status'] : undefined,
    q: typeof search['q'] === 'string' && search['q'] ? search['q'].slice(0, 100) : undefined,
    page: typeof search['page'] === 'number' && search['page'] > 1 ? Math.floor(search['page']) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listOrdersFn({ data: { status: deps.status, q: deps.q, page: deps.page ?? 1 } }),
  component: OrdersPage,
});

function OrdersPage() {
  const { orders, total, limit, stats } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [q, setQ] = useState(search.q ?? '');
  useEffect(() => setQ(search.q ?? ''), [search.q]);
  const page = search.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <h1>Ordrar</h1>
        <p className="admin-muted">Intäkt (betalda + skickade): <strong>{formatPrice(stats.revenue)}</strong></p>
      </div>

      <div className="admin-stats">
        <button type="button" data-active={!search.status} onClick={() => navigate({ search: { q: search.q } })}>
          <span>Alla</span><strong>{Object.values(stats.byStatus).reduce((a, b) => a + b, 0)}</strong>
        </button>
        {orderStatuses.map(s => (
          <button type="button" key={s} data-active={search.status === s} data-status={s} onClick={() => navigate({ search: { status: s, q: search.q } })}>
            <span>{orderStatusLabel[s]}</span><strong>{stats.byStatus[s]}</strong>
          </button>
        ))}
      </div>

      <form className="admin-search" onSubmit={e => { e.preventDefault(); navigate({ search: { status: search.status, q: q.trim() || undefined } }); }}>
        <Search size={16} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Sök ordernummer, namn, e-post eller telefon" aria-label="Sök ordrar" />
        <Button type="submit" size="sm">Sök</Button>
      </form>

      {orders.length === 0 ? (
        <p className="admin-empty">Inga ordrar {search.status || search.q ? 'matchar filtret' : 'ännu'}.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Order</th><th>Datum</th><th>Kund</th><th>Artiklar</th><th>Rabatt</th><th>Summa</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.ref}>
                  <td><Link to="/admin/ordrar/$ref" params={{ ref: o.ref }} className="admin-link">{o.ref}</Link></td>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td><span className="admin-cell-main">{o.name}</span><span className="admin-cell-sub">{o.email}</span></td>
                  <td>{o.itemCount}</td>
                  <td>{o.discountCode ?? '—'}</td>
                  <td><strong>{formatPrice(o.total)}</strong></td>
                  <td><StatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="admin-pager">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => navigate({ search: { ...search, page: page - 1 > 1 ? page - 1 : undefined } })}><ChevronLeft /> Föregående</Button>
          <span>Sida {page} av {pages}</span>
          <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => navigate({ search: { ...search, page: page + 1 } })}>Nästa <ChevronRight /></Button>
        </div>
      )}
    </main>
  );
}
