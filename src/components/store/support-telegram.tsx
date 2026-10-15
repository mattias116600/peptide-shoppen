import type { ReactNode } from 'react';
import { ArrowUpRight, Send } from 'lucide-react';
import { supportInfo } from '@/lib/products';

/** Compact support row: used in the cart, checkout, product pages and tool pages. */
export function TelegramSupportRow({ note }: { note?: ReactNode }) {
  return (
    <a className="tg-row" href={supportInfo.url} target="_blank" rel="noopener noreferrer">
      <span className="tg-row-icon" aria-hidden="true"><Send /></span>
      <span className="tg-row-text">
        <strong>{note ?? 'Har du en fråga? Skriv till oss på Telegram'}</strong>
        <small>{supportInfo.handle} · vi svarar på svenska</small>
      </span>
      <ArrowUpRight className="tg-row-arrow" aria-hidden="true" />
    </a>
  );
}

/** Larger support card: used on contact, FAQ and product pages. */
export function TelegramSupportCard({
  title = 'Support på Telegram',
  body,
  cta = 'Öppna Telegram',
}: {
  title?: string;
  body?: ReactNode;
  cta?: string;
}) {
  return (
    <section className="tg-card">
      <span className="tg-card-icon" aria-hidden="true"><Send /></span>
      <div className="tg-card-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> DIREKTKANAL</div>
        <h2>{title}</h2>
        <p>{body ?? 'Frågor om sortimentet, analysdokumentation eller en beställning? Öppna en chatt med oss — du får svar på svenska.'}</p>
        <span className="tg-card-handle">{supportInfo.handle}</span>
      </div>
      <a className="tg-card-btn" href={supportInfo.url} target="_blank" rel="noopener noreferrer">
        {cta} <ArrowUpRight />
      </a>
    </section>
  );
}
