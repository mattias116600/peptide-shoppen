import { useState } from 'react';
import { createFileRoute, Link, notFound, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ImagePicker } from '@/components/admin/image-picker';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/media';
import { productCategories, type AdminVariant, type ProductGroupInput } from '@/lib/catalog';
import { deleteProductFn, getAdminProductFn, saveProductFn } from '@/lib/catalog-api';

const blank: ProductGroupInput = {
  slug: '', name: '', category: 'Peptider', description: '', badge: '', image: DEFAULT_PRODUCT_IMAGE, featured: false, active: true,
  about: [], specs: [], variants: [{ slug: '', amount: '', price: 0, batch: '', coaUrl: '', active: true }],
};

export const Route = createFileRoute('/admin/produkter/$slug')({
  loader: async ({ params }) => {
    if (params.slug === 'ny') return { product: blank, isNew: true };
    const product = await getAdminProductFn({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return { product: product as ProductGroupInput, isNew: false };
  },
  notFoundComponent: () => <main className="admin-page"><p className="admin-empty">Produkten finns inte.</p><Button asChild variant="outline"><Link to="/admin/produkter"><ArrowLeft /> Till produkter</Link></Button></main>,
  component: ProductEditorRoute,
});

// The editor keeps paragraphs and spec rows as plain text so they are quick to edit.
const aboutToText = (about: string[]) => about.join('\n\n');
const textToAbout = (text: string) => text.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);
const specsToText = (specs: [string, string][]) => specs.map(([k, v]) => `${k}: ${v}`).join('\n');
const textToSpecs = (text: string): [string, string][] =>
  text.split('\n').flatMap((line): [string, string][] => {
    const i = line.indexOf(':');
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    return i > 0 && key && value ? [[key, value]] : [];
  });

// Keyed by slug so the form state resets when a new product is saved and the URL changes.
function ProductEditorRoute() {
  const data = Route.useLoaderData();
  return <ProductEditor key={data.isNew ? 'ny' : data.product.slug} {...data} />;
}

function ProductEditor({ product, isNew }: { product: ProductGroupInput; isNew: boolean }) {
  const router = useRouter();
  const navigate = useNavigate();
  const [form, setForm] = useState(product);
  const [about, setAbout] = useState(aboutToText(product.about));
  const [specs, setSpecs] = useState(specsToText(product.specs));
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ProductGroupInput>(key: K, value: ProductGroupInput[K]) => setForm(f => ({ ...f, [key]: value }));
  const setVariant = (i: number, patch: Partial<AdminVariant>) => setForm(f => ({ ...f, variants: f.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const badPrice = form.variants.find(v => !Number.isInteger(v.price) || v.price < 1);
    if (badPrice) { setMessage({ kind: 'error', text: `Ange ett pris i hela kronor för ${badPrice.amount || 'varje styrka'}.` }); return; }
    setBusy(true);
    try {
      const result = await saveProductFn({ data: { product: { ...form, about: textToAbout(about), specs: textToSpecs(specs) }, isNew } });
      if (!result.ok) { setMessage({ kind: 'error', text: result.error }); return; }
      await router.invalidate();
      if (isNew) await navigate({ to: '/admin/produkter/$slug', params: { slug: result.value } });
      setMessage({ kind: 'ok', text: 'Produkten är sparad.' });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error && err.message.length < 200 ? `Kunde inte spara: ${err.message}` : 'Kunde inte spara. Kontrollera fälten.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Ta bort ${form.name} och alla dess styrkor? Lagda ordrar påverkas inte. Vill du bara dölja produkten, stäng av "Synlig i butiken" i stället.`)) return;
    await deleteProductFn({ data: { slug: form.slug } });
    await router.invalidate();
    await navigate({ to: '/admin/produkter' });
  };

  return (
    <main className="admin-page">
      <Link to="/admin/produkter" className="admin-back"><ArrowLeft size={15} /> Alla produkter</Link>
      <div className="admin-heading">
        <h1>{isNew ? 'Ny produkt' : form.name}</h1>
        {!isNew && <a className="admin-site-link" href={`/produkter/${form.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Visa i butiken</a>}
      </div>

      <form className="admin-editor" onSubmit={save}>
        <section className="admin-card">
          <h2>Grunduppgifter</h2>
          <div className="admin-form-grid">
            <label className="kassa-field"><span>Namn</span><input value={form.name} onChange={e => set('name', e.target.value)} required maxLength={80} /></label>
            <label className="kassa-field"><span>Adress (slug)</span>
              <input value={form.slug} onChange={e => set('slug', e.target.value)} disabled={!isNew} placeholder={isNew ? 'skapas från namnet' : ''} maxLength={60} />
            </label>
            <label className="kassa-field"><span>Kategori</span>
              <input list="product-categories" value={form.category} onChange={e => set('category', e.target.value)} required maxLength={40} />
              <datalist id="product-categories">{productCategories.map(c => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="kassa-field"><span>Etikett (valfri)</span><input value={form.badge} onChange={e => set('badge', e.target.value.toUpperCase())} placeholder="t.ex. NYHET" maxLength={20} /></label>
          </div>
          <label className="kassa-field"><span>Kort beskrivning</span><textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} maxLength={400} /></label>
          <div className="admin-switches">
            <label><Switch checked={form.active} onCheckedChange={v => set('active', v)} /> Synlig i butiken</label>
            <label><Switch checked={form.featured} onCheckedChange={v => set('featured', v)} /> Visa på startsidan</label>
          </div>
        </section>

        <section className="admin-card">
          <h2>Styrkor och priser</h2>
          <div className="admin-table-wrap">
            <table className="admin-table admin-variant-table">
              <thead><tr><th>Styrka</th><th>Pris (kr)</th><th>Batch</th><th>Länk till analysrapport (CoA)</th><th>Synlig</th><th /></tr></thead>
              <tbody>
                {form.variants.map((v, i) => (
                  <tr key={v.slug || `new-${i}`}>
                    <td><input value={v.amount} onChange={e => setVariant(i, { amount: e.target.value })} placeholder="10 mg" required maxLength={30} aria-label="Styrka" /></td>
                    <td><input type="number" min={1} step={1} value={v.price || ''} onChange={e => setVariant(i, { price: Number(e.target.value) })} required aria-label="Pris" /></td>
                    <td><input value={v.batch} onChange={e => setVariant(i, { batch: e.target.value })} maxLength={40} aria-label="Batch" /></td>
                    <td><input type="url" value={v.coaUrl} onChange={e => setVariant(i, { coaUrl: e.target.value })} placeholder="https://" maxLength={300} aria-label="CoA-länk" /></td>
                    <td><Switch checked={v.active} onCheckedChange={a => setVariant(i, { active: a })} aria-label={`Visa ${v.amount}`} /></td>
                    <td><Button type="button" size="icon" variant="ghost" disabled={form.variants.length === 1} aria-label={`Ta bort ${v.amount}`} onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }))}><Trash2 /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" size="sm" variant="outline" className="admin-inline-button" onClick={() => setForm(f => ({ ...f, variants: [...f.variants, { slug: '', amount: '', price: 0, batch: '', coaUrl: '', active: true }] }))}><Plus /> Lägg till styrka</Button>
        </section>

        <section className="admin-card">
          <h2>Bild och produktsida</h2>
          <ImagePicker value={form.image} onChange={v => set('image', v || DEFAULT_PRODUCT_IMAGE)} />
          <label className="kassa-field"><span>Om produkten (fliken Beskrivning) – en tom rad mellan stycken</span><textarea rows={6} value={about} onChange={e => setAbout(e.target.value)} /></label>
          <label className="kassa-field"><span>Specifikationer – en per rad, "Namn: värde"</span><textarea rows={6} value={specs} onChange={e => setSpecs(e.target.value)} placeholder={'Summaformel: C62H98N16O22\nCAS-nummer: 137525-51-0'} /></label>
        </section>

        {message && <p className={message.kind === 'ok' ? 'admin-success' : 'kassa-error'} role="status">{message.text}</p>}
        <div className="admin-editor-actions">
          <Button type="submit" disabled={busy}><Save /> {busy ? 'Sparar…' : isNew ? 'Skapa produkt' : 'Spara ändringar'}</Button>
          {!isNew && <Button type="button" variant="ghost" className="admin-danger" onClick={remove}><Trash2 /> Ta bort produkt</Button>}
        </div>
      </form>
    </main>
  );
}
