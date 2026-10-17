import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatPrice } from '@/lib/products';
import { resolveImage } from '@/lib/media';
import { listAdminProductsFn, moveProductFn, setProductActiveFn } from '@/lib/catalog-api';

export const Route = createFileRoute('/admin/produkter/')({
  loader: () => listAdminProductsFn(),
  component: ProductsPage,
});

function ProductsPage() {
  const groups = Route.useLoaderData();
  const router = useRouter();
  const refresh = () => router.invalidate();

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <h1>Produkter</h1>
        <Button asChild size="sm" className="admin-heading-action"><Link to="/admin/produkter/$slug" params={{ slug: 'ny' }}><Plus /> Ny produkt</Link></Button>
        <p className="admin-muted">Ordningen här är ordningen i butiken. Stjärnmärkta produkter visas på startsidan.</p>
      </div>
      {groups.length === 0 ? (
        <p className="admin-empty">Inga produkter ännu.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Produkt</th><th>Kategori</th><th>Styrkor</th><th>Pris</th><th>Synlig</th><th>Ordning</th></tr></thead>
            <tbody>
              {groups.map((g, i) => {
                const prices = g.variants.filter(v => v.active).map(v => v.price);
                return (
                  <tr key={g.slug} data-inactive={!g.active}>
                    <td>
                      <Link to="/admin/produkter/$slug" params={{ slug: g.slug }} className="admin-product-cell">
                        <img src={resolveImage(g.image)} alt="" width={40} height={40} />
                        <span><span className="admin-cell-main admin-link">{g.name} {g.featured && <Star size={12} className="admin-star" aria-label="Visas på startsidan" />}</span><span className="admin-cell-sub">/produkter/{g.slug}</span></span>
                      </Link>
                    </td>
                    <td>{g.category}</td>
                    <td>{g.variants.map(v => <span key={v.slug} className="admin-chip" data-inactive={!v.active}>{v.amount}</span>)}</td>
                    <td>{prices.length ? (Math.min(...prices) === Math.max(...prices) ? formatPrice(prices[0]!) : `${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))}`) : '—'}</td>
                    <td><Switch checked={g.active} onCheckedChange={async v => { await setProductActiveFn({ data: { slug: g.slug, active: v } }); await refresh(); }} aria-label={`Visa ${g.name} i butiken`} /></td>
                    <td className="admin-order-cell">
                      <Button size="icon" variant="ghost" disabled={i === 0} aria-label={`Flytta ${g.name} upp`} onClick={async () => { await moveProductFn({ data: { slug: g.slug, direction: -1 } }); await refresh(); }}><ArrowUp /></Button>
                      <Button size="icon" variant="ghost" disabled={i === groups.length - 1} aria-label={`Flytta ${g.name} ned`} onClick={async () => { await moveProductFn({ data: { slug: g.slug, direction: 1 } }); await refresh(); }}><ArrowDown /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
