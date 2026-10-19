import { useState } from 'react';
import { createFileRoute, Link, notFound, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ImagePicker } from '@/components/admin/image-picker';
import { estimateReadTime, type ArticleInput } from '@/lib/catalog';
import { deleteArticleFn, getAdminArticleFn, listAdminArticlesFn, listAdminProductsFn, saveArticleFn } from '@/lib/catalog-api';

const today = () => new Date().toISOString().slice(0, 10);
const blank = (): ArticleInput => ({
  slug: '', title: '', metaTitle: '', description: '', category: '', intro: '', date: today(), readTime: 3, image: '', imageAlt: '',
  keywords: [], productSlug: '', sections: [{ title: '', text: '' }], published: false,
});

export const Route = createFileRoute('/admin/blogg/$slug')({
  loader: async ({ params }) => {
    const [products, all] = await Promise.all([listAdminProductsFn(), listAdminArticlesFn()]);
    const options = { products: products.map(p => ({ slug: p.slug, name: p.name })), categories: [...new Set(all.map(a => a.category).filter(Boolean))] };
    if (params.slug === 'ny') return { article: blank(), isNew: true, ...options };
    const article = await getAdminArticleFn({ data: { slug: params.slug } });
    if (!article) throw notFound();
    return { article: article as ArticleInput, isNew: false, ...options };
  },
  notFoundComponent: () => <main className="admin-page"><p className="admin-empty">Artikeln finns inte.</p><Button asChild variant="outline"><Link to="/admin/blogg"><ArrowLeft /> Till bloggen</Link></Button></main>,
  component: ArticleEditorRoute,
});

// Keyed by slug so the form state resets when a new article is saved and the URL changes.
function ArticleEditorRoute() {
  const data = Route.useLoaderData();
  return <ArticleEditor key={data.isNew ? 'ny' : data.article.slug} {...data} />;
}

function ArticleEditor({ article, isNew, products, categories }: { article: ArticleInput; isNew: boolean; products: { slug: string; name: string }[]; categories: string[] }) {
  const router = useRouter();
  const navigate = useNavigate();
  const [form, setForm] = useState(article);
  const [keywords, setKeywords] = useState(article.keywords.join(', '));
  const [autoReadTime, setAutoReadTime] = useState(isNew);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) => setForm(f => ({ ...f, [key]: value }));
  const setSection = (i: number, patch: Partial<ArticleInput['sections'][number]>) => setForm(f => ({ ...f, sections: f.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const moveSection = (i: number, d: -1 | 1) => setForm(f => {
    const sections = [...f.sections];
    [sections[i], sections[i + d]] = [sections[i + d]!, sections[i]!];
    return { ...f, sections };
  });
  const readTime = autoReadTime ? estimateReadTime([form.intro, ...form.sections.flatMap(s => [s.title, s.text])]) : form.readTime;

  const save = async (publish?: boolean) => {
    setMessage(null);
    setBusy(true);
    try {
      const data = {
        ...form,
        readTime,
        published: publish ?? form.published,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        sections: form.sections.filter(s => s.title.trim() || s.text.trim()),
      };
      const result = await saveArticleFn({ data: { article: data, isNew } });
      if (!result.ok) { setMessage({ kind: 'error', text: result.error }); return; }
      setForm(data);
      await router.invalidate();
      if (isNew) await navigate({ to: '/admin/blogg/$slug', params: { slug: result.value } });
      setMessage({ kind: 'ok', text: publish ? 'Artikeln är publicerad.' : data.published ? 'Ändringarna är sparade.' : 'Utkastet är sparat.' });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error && err.message.length < 200 ? `Kunde inte spara: ${err.message}` : 'Kunde inte spara. Kontrollera fälten.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Ta bort artikeln "${form.title}"? Det går inte att ångra.`)) return;
    await deleteArticleFn({ data: { slug: form.slug } });
    await router.invalidate();
    await navigate({ to: '/admin/blogg' });
  };

  return (
    <main className="admin-page">
      <Link to="/admin/blogg" className="admin-back"><ArrowLeft size={15} /> Alla artiklar</Link>
      <div className="admin-heading">
        <h1>{isNew ? 'Ny artikel' : form.title}</h1>
        {!isNew && <span className="admin-pill" data-status={form.published ? 'skickad' : 'ny'}>{form.published ? 'Publicerad' : 'Utkast'}</span>}
        {!isNew && form.published && <a className="admin-site-link" href={`/blogg/${form.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Visa i bloggen</a>}
      </div>

      <form className="admin-editor" onSubmit={e => { e.preventDefault(); void save(); }}>
        <section className="admin-card">
          <h2>Rubrik och ingress</h2>
          <label className="kassa-field"><span>Rubrik</span><input value={form.title} onChange={e => set('title', e.target.value)} required maxLength={160} /></label>
          <div className="admin-form-grid">
            <label className="kassa-field"><span>Adress (slug)</span><input value={form.slug} onChange={e => set('slug', e.target.value)} disabled={!isNew} placeholder={isNew ? 'skapas från rubriken' : ''} maxLength={80} /></label>
            <label className="kassa-field"><span>Kategori</span>
              <input list="article-categories" value={form.category} onChange={e => set('category', e.target.value)} maxLength={60} />
              <datalist id="article-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="kassa-field"><span>Datum</span><input type="date" value={form.date} onChange={e => set('date', e.target.value)} required /></label>
          </div>
          <label className="kassa-field"><span>Ingress (visas i listan och överst i artikeln)</span><textarea rows={3} value={form.intro} onChange={e => set('intro', e.target.value)} maxLength={600} /></label>
        </section>

        <section className="admin-card">
          <h2>Bild</h2>
          <ImagePicker value={form.image} onChange={v => set('image', v)} allowNone label="Huvudbild" />
          <label className="kassa-field"><span>Bildtext för skärmläsare (alt-text)</span><input value={form.imageAlt} onChange={e => set('imageAlt', e.target.value)} maxLength={200} /></label>
        </section>

        <section className="admin-card">
          <h2>Innehåll</h2>
          {form.sections.map((s, i) => (
            <div className="admin-section-editor" key={i}>
              <div className="admin-section-head">
                <strong>Avsnitt {i + 1}</strong>
                <span>
                  <Button type="button" size="icon" variant="ghost" disabled={i === 0} aria-label="Flytta avsnitt upp" onClick={() => moveSection(i, -1)}><ArrowUp /></Button>
                  <Button type="button" size="icon" variant="ghost" disabled={i === form.sections.length - 1} aria-label="Flytta avsnitt ned" onClick={() => moveSection(i, 1)}><ArrowDown /></Button>
                  <Button type="button" size="icon" variant="ghost" aria-label="Ta bort avsnitt" onClick={() => setForm(f => ({ ...f, sections: f.sections.filter((_, j) => j !== i) }))}><Trash2 /></Button>
                </span>
              </div>
              <label className="kassa-field"><span>Mellanrubrik</span><input value={s.title} onChange={e => setSection(i, { title: e.target.value })} maxLength={160} /></label>
              <label className="kassa-field"><span>Text</span><textarea rows={5} value={s.text} onChange={e => setSection(i, { text: e.target.value })} maxLength={8000} /></label>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" className="admin-inline-button" onClick={() => setForm(f => ({ ...f, sections: [...f.sections, { title: '', text: '' }] }))}><Plus /> Lägg till avsnitt</Button>
        </section>

        <section className="admin-card">
          <h2>Sökmotorer och koppling</h2>
          <div className="admin-form-grid">
            <label className="kassa-field"><span>SEO-titel (valfri)</span><input value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} placeholder="Samma som rubriken" maxLength={160} />
              <CharCount length={(form.metaTitle || form.title).length} ideal={[20, 44]} hint="Upp till 44 tecken får plats i Google tillsammans med ” | Peptidesweden”." />
            </label>
            <label className="kassa-field"><span>Länka till produkt</span>
              <select value={form.productSlug} onChange={e => set('productSlug', e.target.value)}>
                <option value="">Ingen</option>
                {products.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
            </label>
            <label className="kassa-field"><span>Lästid (min)</span>
              <input type="number" min={1} max={120} value={readTime} onChange={e => { setAutoReadTime(false); set('readTime', Math.max(1, Number(e.target.value) || 1)); }} />
            </label>
          </div>
          <label className="kassa-field"><span>Metabeskrivning (visas i sökresultat)</span><textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} maxLength={300} />
            <CharCount length={form.description.length} ideal={[120, 160]} hint="120–160 tecken visas bäst i sökresultat. Tom = ingressen används." />
          </label>
          <label className="kassa-field"><span>Nyckelord, separerade med komma</span><input value={keywords} onChange={e => setKeywords(e.target.value)} /></label>
          <div className="admin-switches"><label><Switch checked={form.published} onCheckedChange={v => set('published', v)} /> Publicerad i bloggen</label></div>
        </section>

        {message && <p className={message.kind === 'ok' ? 'admin-success' : 'kassa-error'} role="status">{message.text}</p>}
        <div className="admin-editor-actions">
          <Button type="submit" disabled={busy}><Save /> {busy ? 'Sparar…' : 'Spara'}</Button>
          {!form.published && <Button type="button" variant="outline" disabled={busy} onClick={() => void save(true)}>Spara och publicera</Button>}
          {!isNew && <Button type="button" variant="ghost" className="admin-danger" onClick={remove}><Trash2 /> Ta bort artikel</Button>}
        </div>
      </form>
    </main>
  );
}

function CharCount({ length, ideal, hint }: { length: number; ideal: [number, number]; hint: string }) {
  const ok = length >= ideal[0] && length <= ideal[1];
  return <small className="admin-char-count" data-ok={ok}>{length} tecken · {hint}</small>;
}
