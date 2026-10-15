import { createFileRoute, Link } from '@tanstack/react-router';
import { FlaskConical, FileCheck2, Truck, Microscope, ArrowRight } from 'lucide-react';
import vialImg from '@/assets/peptide-vial.jpg';
import { shippingInfo } from '@/lib/products';

export const Route = createFileRoute('/om-oss')({
  head: () => ({
    meta: [
      { title: 'Vår filosofi | Peptidesweden' },
      { name: 'description', content: 'Lär känna Peptidesweden och vår filosofi kring precision och transparens i laboratorieforskning.' },
      { property: 'og:title', content: 'Vår filosofi | Peptidesweden' },
      { property: 'og:description', content: 'Precision, transparens och omtanke i varje detalj.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: About,
});

const values = [
  {
    icon: Microscope,
    title: 'Ett genomtänkt urval',
    body: 'Vi presenterar ett fokuserat sortiment av peptider för laboratoriestudier. Produktinformationen ska vara tydlig, lättillgänglig och fri från obestyrkta påståenden.',
  },
  {
    icon: FileCheck2,
    title: 'Dokumentation före löften',
    body: 'En produkts renhet och kvalitet behöver styrkas med batchspecifik dokumentation. Inga certifieringar eller analysresultat påstås här utan verifiering.',
  },
  {
    icon: Truck,
    title: 'Snabb och diskret leverans',
    body: `Beställningar skickas i neutral förpackning. ${shippingInfo.summary} Leveransadresser inom Norden.`,
  },
  {
    icon: FlaskConical,
    title: 'Endast för laboratorieforskning',
    body: 'Produkterna är inte läkemedel och är inte avsedda att användas på människor eller djur. De säljs endast till verifierad laboratorieforskning.',
  },
];

const principles = [
  {
    title: 'Tydlig produktinformation',
    body: 'Varje peptid beskrivs med alternativa namn, sekvens, formel och molmassa — så att du kan jämföra mot egen referenslitteratur.',
  },
  {
    title: 'Spårbara analyser',
    body: 'När en batch har en analysrapport länkar vi direkt till den från produktsidan. Saknas dokumentation skriver vi det rakt ut i stället för att dölja det.',
  },
  {
    title: 'Omtanke i varje detalj',
    body: 'Från förpackning till leveransinformation ska allt kännas genomtänkt — forskning förtjänar omtanke.',
  },
];

function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="content-width about-hero-inner">
          <div className="about-hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> OM PEPTIDESWEDEN</div>
            <h1>Forskning förtjänar omtanke.</h1>
            <p className="lead">
              Peptidesweden är ett butikskoncept för forskningspeptider, med precision
              och transparens som utgångspunkt. Vi tror att bra forskning börjar med
              pålitliga material — och ärlig information om dem.
            </p>
            <div className="about-hero-actions">
              <Link to="/produkter" className="about-btn-primary">
                Utforska sortimentet <ArrowRight />
              </Link>
              <Link to="/blogg" className="about-btn-outline">
                Läs i kunskapsbanken
              </Link>
            </div>
          </div>
          <div className="about-hero-media">
            <img src={vialImg} alt="Forskningspeptider från Peptidesweden" loading="eager" />
            <span className="about-hero-tag">Laboratorieforskning</span>
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="content-width">
          <div className="section-heading">
            <h2>Vad vi står för</h2>
            <p>Fyra principer som styr allt vi gör — från sortiment till förpackning.</p>
          </div>
          <div className="about-values-grid">
            {values.map(({ icon: Icon, title, body }) => (
              <article key={title} className="about-value-card">
                <span className="about-value-icon"><Icon /></span>
                <strong>{title}</strong>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-principles">
        <div className="content-width about-principles-inner">
          <div className="about-principles-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> SÅ ARBETAR VI</div>
            <h2>Transparens i varje steg</h2>
            <p>
              Vi skulle hellre säga "det vet vi inte" än att gissa. Därför är vår
              produktinformation skriven från allmänt tillgänglig kemidata, och
              analysrapporter länkas per batch så snart de finns.
            </p>
          </div>
          <ol className="about-principles-list">
            {principles.map((p, i) => (
              <li key={p.title}>
                <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{p.title}</strong>
                  <p>{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="about-cta">
        <div className="content-width about-cta-inner">
          <h2>Nyfiken på sortimentet?</h2>
          <p>Fem peptider, elva styrkor och batchspecifika analysrapporter där de finns.</p>
          <div className="about-hero-actions">
            <Link to="/produkter" className="about-btn-primary">
              Se produkterna <ArrowRight />
            </Link>
            <Link to="/kalkylator" className="about-btn-outline">
              Prova kalkylatorn
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
