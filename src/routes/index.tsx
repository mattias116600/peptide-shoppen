import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, FlaskConical, ShieldCheck, Package, Microscope, FileCheck2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/store/product-card';
import { findGroup } from '@/lib/products';
import hero from '@/assets/peptides-hero.jpg';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Peptidesweden | Forskningspeptider i Sverige' },
      { name: 'description', content: 'Upptäck Peptidesweden. Ett utvalt sortiment av peptider för laboratorieforskning med analysrapporter.' },
      { property: 'og:title', content: 'Peptidesweden | Forskningspeptider i Sverige' },
      { property: 'og:description', content: 'Precision, transparens och ett utvalt sortiment för laboratorieforskning.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Home,
});

const features = [
  { icon: Microscope, title: 'För laboratorieforskning', sub: 'Ett fokuserat sortiment' },
  { icon: FileCheck2, title: 'Analysrapporter', sub: 'CoA per batch och styrka' },
  { icon: Package, title: 'Diskret förpackning', sub: 'Omsorg i varje detalj' },
  { icon: ShieldCheck, title: 'Transparens', sub: 'Tydlig produktinformation' },
];

function Home() {
  return (
    <>
      <section className="fp-hero">
        <div className="content-width fp-hero-grid">
          <div className="fp-hero-copy">
            <div className="fp-pill"><span className="mini-flag" aria-hidden="true" /> Svensk precision · Forskningskvalitet</div>
            <h1>Peptider för<br /><em>seriös forskning.</em></h1>
            <p>Ett noga utvalt sortiment med analysrapport för varje batch. Välj styrka, se rapporten och beställ – enkelt och transparent.</p>
            <div className="fp-actions">
              <Button asChild size="lg"><Link to="/produkter">Utforska sortimentet <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/kalkylator"><Calculator /> Kalkylator</Link></Button>
            </div>
            <dl className="fp-stats">
              <div><dt>5</dt><dd>peptider</dd></div>
              <div><dt>11</dt><dd>styrkor</dd></div>
              <div><dt>CoA</dt><dd>per batch</dd></div>
            </dl>
          </div>
          <div className="fp-hero-visual">
            <img src={hero} alt="Peptidesweden forskningsvialer med blågula detaljer" width={1536} height={1024} fetchPriority="high" />
            <Link to="/produkter/$slug" params={{ slug: 'retatrutide' }} className="fp-float">
              <FlaskConical /><div><strong>Retatrutide</strong><span>10–60 mg · CoA tillgänglig</span></div><ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section className="content-width fp-features">
        {features.map((f) => (
          <div className="fp-feature" key={f.title}><f.icon /><strong>{f.title}</strong><p>{f.sub}</p></div>
        ))}
      </section>

      <section className="home-products content-width" id="sortiment">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="eyebrow-line" /> SORTIMENT</div><h2>Utvalda peptider</h2><p>Välj styrka direkt på kortet.</p></div>
          <Link to="/produkter">Se hela sortimentet <ArrowRight /></Link>
        </div>
        <div className="product-grid">
          {['retatrutide', 'ghk-cu', 'mots-c', 'bpc-157-tb-500'].map((slug) => { const p = findGroup(slug); return p ? <ProductCard key={p.slug} product={p} /> : null; })}
        </div>
      </section>

      <section className="content-width fp-steps">
        <h2>Så fungerar det</h2>
        <ol>
          <li><span>1</span><strong>Välj peptid & styrka</strong><p>Varje produkt finns i flera styrkor.</p></li>
          <li><span>2</span><strong>Granska analysrapporten</strong><p>Länk till CoA för vald batch.</p></li>
          <li><span>3</span><strong>Lägg i varukorgen</strong><p>Samla dina produkter på ett ställe.</p></li>
        </ol>
      </section>

      <section className="content-width fp-cta">
        <div>
          <h2>Forskning förtjänar <em>omtanke.</em></h2>
          <p>Samtliga produkter är avsedda enbart för laboratorieforskning. Ej för användning på människor eller djur.</p>
        </div>
        <Button asChild size="lg" variant="secondary"><Link to="/om-oss">Läs om oss <ArrowRight /></Link></Button>
      </section>
    </>
  );
}
