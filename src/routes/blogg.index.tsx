import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, Clock } from 'lucide-react';
import { listArticlesFn } from '@/lib/catalog-api';
import { resolveImage } from '@/lib/media';

export const Route = createFileRoute('/blogg/')({
  head: () => ({
    meta: [
      { title: 'Blogg om peptider & forskning | Peptidesweden' },
      { name: 'description', content: 'Guider om peptider, Retatrutide, BPC-157, GHK-Cu, MOTS-C, analysrapporter, HPLC, förvaring och koncentration — Peptideswedens kunskapsblogg.' },
      { property: 'og:title', content: 'Blogg om peptider & forskning | Peptidesweden' },
      { property: 'og:description', content: 'Guider om peptider, analys och laboratoriekunskap.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: '/blogg' }],
  }),
  loader: () => listArticlesFn(),
  component: Blog,
});

const fmt = (d: string) => new Date(d).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });

function Blog() {
  const articles = Route.useLoaderData();
  return <main className="content-width">
    <div className="page-top"><div className="eyebrow"><span className="eyebrow-line" /> KUNSKAP & PERSPEKTIV</div><h1>Blogg om peptider</h1><p>Guider om peptider, analysrapporter och laboratoriekunskap.</p></div>
    <div className="blog-grid">{articles.map((a, i) => <article className="blog-card" key={a.slug}>
      {a.image && <Link to="/blogg/$slug" params={{ slug: a.slug }} className="blog-image"><img src={resolveImage(a.image)} alt={a.imageAlt} width={1280} height={720} loading={i < 3 ? 'eager' : 'lazy'} /></Link>}
      <div className="eyebrow">{a.category}</div>
      <Link to="/blogg/$slug" params={{ slug: a.slug }}><h2>{a.title}</h2></Link>
      <p>{a.intro}</p>
      <p className="blog-meta"><time dateTime={a.date}>{fmt(a.date)}</time> · <Clock size={13} /> {a.readTime} min</p>
      <Link to="/blogg/$slug" params={{ slug: a.slug }} className="article-link">Läs artikeln <ArrowUpRight size={16} /></Link>
    </article>)}</div>
  </main>;
}
