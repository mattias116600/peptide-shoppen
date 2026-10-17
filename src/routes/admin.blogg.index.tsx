import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveImage } from '@/lib/media';
import { listAdminArticlesFn } from '@/lib/catalog-api';

export const Route = createFileRoute('/admin/blogg/')({
  loader: () => listAdminArticlesFn(),
  component: BlogAdminPage,
});

const fmtDate = (d: string) => new Date(d).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });

function BlogAdminPage() {
  const articles = Route.useLoaderData();
  return (
    <main className="admin-page">
      <div className="admin-heading">
        <h1>Blogg</h1>
        <Button asChild size="sm" className="admin-heading-action"><Link to="/admin/blogg/$slug" params={{ slug: 'ny' }}><Plus /> Ny artikel</Link></Button>
        <p className="admin-muted">Artiklar visas i butiken i datumordning, nyaste först. Utkast syns bara här.</p>
      </div>
      {articles.length === 0 ? (
        <p className="admin-empty">Inga artiklar ännu.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Artikel</th><th>Kategori</th><th>Datum</th><th>Status</th></tr></thead>
            <tbody>
              {articles.map(a => (
                <tr key={a.slug} data-inactive={!a.published}>
                  <td>
                    <Link to="/admin/blogg/$slug" params={{ slug: a.slug }} className="admin-product-cell">
                      {a.image ? <img src={resolveImage(a.image)} alt="" width={56} height={32} className="admin-thumb-wide" /> : <span className="admin-thumb-wide" />}
                      <span><span className="admin-cell-main admin-link">{a.title}</span><span className="admin-cell-sub">/blogg/{a.slug}</span></span>
                    </Link>
                  </td>
                  <td>{a.category || '—'}</td>
                  <td>{fmtDate(a.date)}</td>
                  <td><span className="admin-pill" data-status={a.published ? 'skickad' : 'ny'}>{a.published ? 'Publicerad' : 'Utkast'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
