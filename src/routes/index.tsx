import { createFileRoute, Link } from '@tanstack/react-router';
import { organizationLd, seoHead, websiteLd } from '@/lib/seo';
import { ArrowRight, FlaskConical, FileText, Layers, ShieldCheck, Calculator, BookOpen, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/store/product-card';
import { shippingInfo } from '@/lib/products';
import { useCatalog } from '@/components/store/store-provider';
import hero from '@/assets/nordic-lab-hero.webp';

export const Route = createFileRoute('/')({
  head: () => seoHead({ title: 'Peptider för laboratorieforskning', description: 'Peptidesweden säljer peptider för laboratorieforskning: Retatrutide, BPC-157, GHK-Cu, MOTS-C och blends. Analysrapport per batch, leverans med PostNord 1–3 dagar.', path: '/', jsonLd: [organizationLd(), websiteLd()] }),
  component: Home,
});

const features = (groups: number, strengths: number) => [
  { icon: FlaskConical, title: 'Endast laboratorieforskning', sub: 'Ett fokuserat sortiment' },
  { icon: Layers, title: `${groups} ${groups === 1 ? 'peptid' : 'peptider'} · ${strengths} ${strengths === 1 ? 'styrka' : 'styrkor'}`, sub: 'Välj efter ditt forskningsprojekt' },
  { icon: FileText, title: 'Batchspecifika rapporter', sub: 'Se tillgängliga analyser' },
  { icon: ShieldCheck, title: 'Tydlig produktinformation', sub: 'Specifikationer på varje produktsida' },
];

function Home() {
  const { groups, products } = useCatalog();
  const featured = groups.filter(g => g.featured);
  const peptides = groups.filter(g => g.kind === 'peptid');
  const peptideStrengths = products.filter(p => peptides.some(g => g.slug === p.group)).length;
  return <main>
    <section className="nordic-hero">
      <img className="nordic-hero-image" src={hero} alt="Tre illustrativa forskningsvialer med blå och gula lock" width={1920} height={1024} fetchPriority="high" />
      <div className="content-width nordic-hero-content">
        <div className="nordic-hero-copy">
          <div className="eyebrow"><span className="mini-flag" aria-hidden="true" /> FORSKNING. I FOKUS.</div>
          <h1>Peptidesweden.<span>Precision börjar här.</span></h1>
          <p>Ett utvalt sortiment av peptider för laboratorieforskning. Tydlig information, valbara styrkor och tillgängliga analysrapporter.</p>
          <div className="nordic-hero-actions">
            <Button asChild size="lg"><Link to="/produkter">Utforska sortimentet <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/kalkylator"><Calculator /> Kalkylator</Link></Button>
          </div>
          <p className="nordic-hero-note"><FlaskConical /> Endast för forskning. Ej för människor eller djur.</p>
        </div>
      </div>
      <span className="nordic-image-caption">Varumärkesillustration</span>
    </section>
    <section className="nordic-strip">
      <div className="content-width nordic-strip-inner">
        {features(peptides.length, peptideStrengths).map(f => <div className="nordic-strip-item" key={f.title}><f.icon /><div><strong>{f.title}</strong><p>{f.sub}</p></div></div>)}
      </div>
    </section>
    <section className="content-width home-products">
      <div className="section-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> SORTIMENTET</div><h2>Utvalda forskningspeptider</h2><p>En peptid. Flera styrkor. Hitta ditt alternativ.</p></div>
        <Link to="/produkter">Alla produkter <ArrowRight /></Link>
      </div>
      <div className="product-grid">{(featured.length ? featured : groups).slice(0, 4).map(p => <ProductCard product={p} key={p.slug} />)}</div>
    </section>
    <section className="nordic-shipping">
      <div className="content-width nordic-shipping-inner">
        <span className="nordic-shipping-icon"><Truck /></span>
        <div><strong>Skickas med {shippingInfo.carrier}</strong><p>Neutral förpackning och leverans {shippingInfo.leadTime}.</p></div>
        <span className="nordic-shipping-tag">{shippingInfo.leadTime}</span>
      </div>
    </section>
    <section className="nordic-lab-band">
      <div className="content-width nordic-lab-inner">
        <div><div className="eyebrow"><span className="eyebrow-line" /> KUNSKAP & VERKTYG</div><h2>Mer än ett sortiment.<br />Ett tydligare underlag.</h2><p>Fördjupa dig i peptider, läs om analysmetoder och beräkna masskoncentration för ditt laboratoriearbete.</p></div>
        <div className="nordic-lab-links">
          <Link to="/kalkylator"><Calculator /><div><strong>Laboratoriekalkylator</strong><span>Masskoncentration i mg/ml</span></div><ArrowRight /></Link>
          <Link to="/blogg"><BookOpen /><div><strong>Kunskap om peptider</strong><span>Artiklar om forskning och dokumentation</span></div><ArrowRight /></Link>
          <Link to="/om-oss"><ShieldCheck /><div><strong>Om Peptidesweden</strong><span>Vårt fokus på laboratorieforskning</span></div><ArrowRight /></Link>
        </div>
      </div>
    </section>
    <div className="content-width nordic-research"><FlaskConical /><div><strong>Forskning, och inget annat.</strong><p>Samtliga produkter är endast avsedda för laboratorieforskning. Ej för användning på människor eller djur.</p></div></div>
  </main>;
}
