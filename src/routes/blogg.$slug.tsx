import { createFileRoute, Link, notFound } from '@tanstack/react-router';
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
  head: ({ loaderData: a, params }) => ({
    meta: [
      { title: `${a?.metaTitle ?? 'Artikel'} | Peptidesweden` },
      { name: 'description', content: a?.description ?? 'Kunskap från Peptidesweden.' },
      { name: 'keywords', content: a?.keywords.join(', ') ?? '' },
      { property: 'og:title', content: a?.metaTitle ?? 'Artikel' },
      { property: 'og:description', content: a?.description ?? '' },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: `/blogg/${params.slug}` },
      { property: 'article:published_time', content: a?.date ?? '' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: `/blogg/${params.slug}` }],
    scripts: a ? [{ type: 'application/ld+json', children: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.description, datePublished: a.date, inLanguage: 'sv-SE', keywords: a.keywords.join(', '), author: { '@type': 'Organization', name: 'Peptidesweden' }, publisher: { '@type': 'Organization', name: 'Peptidesweden' } }) }] : [],
  }),
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
