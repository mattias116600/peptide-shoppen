import type { ReactNode } from 'react';
import { CompanyDetails } from './company-details';

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Shared layout for the terms of sale and the privacy policy: contents list, numbered sections, seller details. */
export function LegalPage({ eyebrow, title, lead, updated, sections }: { eyebrow: string; title: string; lead: string; updated: string; sections: LegalSection[] }) {
  return (
    <main className="content-width info-page legal-page">
      <div className="eyebrow"><span className="eyebrow-line" /> {eyebrow}</div>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      <p className="legal-updated">Senast uppdaterad {updated}</p>
      <nav className="legal-toc" aria-label="Innehåll">
        <ol>{sections.map(s => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}</ol>
      </nav>
      {sections.map((s, i) => (
        <section key={s.id} id={s.id} className="legal-section">
          <h2><span>{String(i + 1).padStart(2, '0')}</span> {s.title}</h2>
          {s.body}
        </section>
      ))}
      <div className="legal-company">
        <h2>Säljare och kontakt</h2>
        <CompanyDetails />
      </div>
    </main>
  );
}
