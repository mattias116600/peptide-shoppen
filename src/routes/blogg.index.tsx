import { createFileRoute, Link } from '@tanstack/react-router';
import { breadcrumbLd, seoHead } from '@/lib/seo';
import { ArrowUpRight, Clock } from 'lucide-react';
import { listArticlesFn } from '@/lib/catalog-api';
import { resolveImage } from '@/lib/media';

export const Route = createFileRoute('/blogg/')({
  head: () => seoHead({ title: 'Blogg om peptider och forskning', description: 'Guider om peptider, analysrapporter, HPLC, förvaring och koncentration i laboratoriet, plus genomgångar av Retatrutide, BPC-157, GHK-Cu och MOTS-C.', path: '/blogg', jsonLd: [breadcrumbLd([['Hem', '/'], ['Blogg', '/blogg']])] }),
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
