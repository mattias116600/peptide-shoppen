import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, BookOpen, Calculator, FileCheck2, Mail, MessageCircleQuestion, Send } from 'lucide-react';
import { TelegramSupportCard } from '@/components/store/support-telegram';
import { supportInfo } from '@/lib/products';
import vialImg from '@/assets/peptides-hero.jpg';

export const Route = createFileRoute('/kontakt')({
  head: () => ({
    meta: [
      { title: 'Kontakt | Peptidesweden' },
      { name: 'description', content: 'Kom i kontakt med Peptidesweden — svar om sortiment, analysdokumentation och leverans. Vanliga frågor besvaras i FAQ och kunskapsbanken.' },
      { property: 'og:title', content: 'Kontakt | Peptidesweden' },
      { property: 'og:description', content: 'Snabba vägar till svar om sortiment, analysrapporter och leverans.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Contact,
});

const shortcuts = [
  {
    icon: MessageCircleQuestion,
    title: 'Vanliga frågor',
    body: 'Svar om användningsområde, analysdokumentation, förvaring och hur beställningar skickas.',
    to: '/faq',
    label: 'Besök FAQ',
  },
  {
    icon: Calculator,
    title: 'Kalkylatorn',
    body: 'Räknar du med våra peptider i labbet? Kalkylatorn tar fram koncentrationen i mg/ml direkt.',
    to: '/kalkylator',
    label: 'Öppna kalkylatorn',
  },
  {
    icon: BookOpen,
    title: 'Kunskapsbanken',
    body: 'Tio artiklar om peptider, analysrapporter och laboratoriemetoder — skrivna för forskare.',
    to: '/blogg',
    label: 'Läs artiklarna',
  },
  {
    icon: FileCheck2,
    title: 'Produktdokumentation',
    body: 'Varje produktsida listar specifikationer och länkar batchens analysrapport där den finns.',
    to: '/produkter',
    label: 'Se sortimentet',
  },
];

const beforeYouWrite = [
  {
    title: 'Kolla produktsidans analysrapport',
    body: 'Frågor om renhet och kvalitet besvaras av batchens analysrapport, som länkas direkt från produktsidan när den finns.',
  },
  {
    title: 'Läs frågan i FAQ först',
    body: 'Många frågor — om leveranstid, förvaring och användningsområde — är redan besvarade i vår FAQ.',
  },
  {
    title: 'Koncentration? Använd kalkylatorn',
    body: 'Uträkningar av mg/ml och µg per 0,1 ml gör kalkylatorn automatiskt — inga uppgifter behöver skickas till oss.',
  },
];

function Contact() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="content-width about-hero-inner">
          <div className="about-hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> KONTAKT</div>
            <h1>Vi finns här för din forskning.</h1>
            <p className="lead">
              Frågor om sortimentet, analysdokumentation eller en beställning?
              Börja med snabbvägarna nedan — oftast finns svaret redan på sajten.
            </p>
            <div className="about-hero-actions">
              <a className="about-btn-primary" href={supportInfo.url} target="_blank" rel="noopener noreferrer">
                Ställ en fråga på Telegram <Send />
              </a>
              <Link to="/faq" className="about-btn-outline">
                Besök FAQ <ArrowRight />
              </Link>
              <Link to="/produkter" className="about-btn-outline">
                Utforska sortimentet
              </Link>
            </div>
          </div>
          <div className="about-hero-media">
            <img src={vialImg} alt="Peptidvialer från Peptidesweden" loading="eager" />
            <span className="about-hero-tag">Laboratorieforskning</span>
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="content-width">
          <div className="section-heading">
            <h2>Snabba vägar till svar</h2>
            <p>Fyra ställen där svaret oftast redan finns — före en förfrågan.</p>
          </div>
          <div className="about-values-grid">
            {shortcuts.map(({ icon: Icon, title, body, to, label }) => (
              <Link key={title} to={to} className="about-value-card contact-shortcut">
                <span className="about-value-icon"><Icon /></span>
                <strong>{title}</strong>
                <p>{body}</p>
                <span className="contact-shortcut-link">{label} <ArrowRight /></span>
              </Link>
            ))}
          </div>

          <TelegramSupportCard title="Support på Telegram" body="Frågor om sortimentet, analysdokumentation, förvaring eller en beställning? Öppna en chatt med oss — du får svar på svenska." cta="Öppna Telegram" />

          <div className="contact-direct">
            <span className="about-value-icon"><Mail /></span>
            <div>
              <strong>Direkt e-postkontakt</strong>
              <p>
                En verifierad e-postadress för kundfrågor läggs upp här inom kort.
                Tills dess är Telegram kanalen ovan det snabbaste sättet att få svar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-principles">
        <div className="content-width about-principles-inner">
          <div className="about-principles-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> FÖRE DU SKRIVER</div>
            <h2>Tre kontrollpunkter</h2>
            <p>
              Vi vill att svaret ska komma så snabbt som möjligt. Genom att gå
              igenom dessa tre punkter får du svar på det mesta.
            </p>
          </div>
          <ol className="about-principles-list">
            {beforeYouWrite.map((p, i) => (
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
          <h2>Hittade du inte svaret?</h2>
          <p>Kunskapsbanken täcker peptider, analysrapporter och laboratoriemetoder i tio artiklar.</p>
          <div className="about-hero-actions">
            <Link to="/blogg" className="about-btn-primary">
              Läs i kunskapsbanken <ArrowRight />
            </Link>
            <Link to="/om-oss" className="about-btn-outline">
              Läs om vår filosofi
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
