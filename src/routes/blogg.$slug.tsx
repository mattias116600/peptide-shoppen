import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl, breadcrumbLd, seoHead } from '@/lib/seo';
import { ArrowLeft, ArrowUpRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getArticleFn, listArticlesFn } from '@/lib/catalog-api';
import { resolveImage } from '@/lib/media';
import { TelegramSupportRow } from '@/components/store/support-telegram';

export const Route = createFileRoute('/blogg/$slug')({
  loader: async ({ params }) => {
    const [article, all] = await Promise.all([getArticleFn({ data: { slug: params.slug } }), listArticlesFn()]);
    if (!article) throw notFound();
    return { ...article, related: all.filter(x => x.slug !== article.slug && x.category === article.category).slice(0, 3).map(x => ({ slug: x.slug, title: x.title })) };
  },
  head: ({ loaderData: a, params }) => {
    const path = `/blogg/${params.slug}`;
    if (!a) return seoHead({ title: 'Artikel', description: DEFAULT_DESCRIPTION, path });
    const image = a.image ? { url: resolveImage(a.image), alt: a.imageAlt || a.title, ...(a.image.startsWith('bundled:') ? { width: 1280, height: 720 } : {}) } : undefined;
    return seoHead({
      title: a.metaTitle || a.title,
      description: a.description || a.intro,
      path,
      type: 'article',
      ...(image ? { image } : {}),
      extraMeta: [
        { property: 'article:published_time', content: a.date },
        ...(a.updatedAt ? [{ property: 'article:modified_time', content: a.updatedAt }] : []),
        ...(a.category ? [{ property: 'article:section', content: a.category }] : []),
        ...(a.keywords.length ? [{ name: 'keywords', content: a.keywords.join(', ') }] : []),
      ],
      jsonLd: [
        {
          '@type': 'BlogPosting',
          headline: a.title.slice(0, 110),
          description: a.description || a.intro,
          ...(image ? { image: [absoluteUrl(image.url)] } : {}),
          datePublished: a.date,
          dateModified: a.updatedAt ?? a.date,
          inLanguage: 'sv-SE',
          keywords: a.keywords.join(', '),
          mainEntityOfPage: absoluteUrl(path),
          author: { '@type': 'Organization', name: SITE_NAME, url: `${SITE_URL}/` },
          publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: absoluteUrl('/icon-512.png') } },
        },
        breadcrumbLd([['Hem', '/'], ['Blogg', '/blogg'], [a.title, path]]),
      ],
    });
  },
  component: ArticlePage,
});

function ArticlePage() {
  const a = Route.useLoaderData();
  const related = a.related;
  return <main className="content-width info-page article-page">
    <Button variant="link" asChild><Link to="/blogg"><ArrowLeft /> Tillbaka till bloggen</Link></Button>
    <div className="eyebrow article-category">{a.category}</div>
    <h1>{a.title}</h1>
    <p className="blog-meta"><time dateTime={a.date}>{new Date(a.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}</time> · <Clock size={13} /> {a.readTime} min läsning</p>
    {a.image && <img className="article-hero" src={resolveImage(a.image)} alt={a.imageAlt} width={1280} height={720} />}
    <p className="lead">{a.intro}</p>
    {a.sections.map(s => <section className="article-section" key={s.title}><h2>{s.title}</h2><p>{s.text}</p></section>)}
    {a.productSlug && <Button asChild><Link to="/produkter/$slug" params={{ slug: a.productSlug }}>Se produkten <ArrowUpRight size={16} /></Link></Button>}
    {related.length > 0 && <section className="article-section"><h2>Läs också</h2><ul>{related.map(r => <li key={r.slug}><Link to="/blogg/$slug" params={{ slug: r.slug }} className="article-link">{r.title}</Link></li>)}</ul></section>}
    <p className="calculator-notice">Allmän information för laboratorieforskning, inte medicinsk rådgivning.</p>
    <TelegramSupportRow note="Frågor om artikeln? Skriv till oss på Telegram" />
  </main>;
}
