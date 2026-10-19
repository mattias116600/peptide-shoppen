import { useEffect } from 'react';
import { seoHead } from '@/lib/seo';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Home, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TelegramSupportRow } from '@/components/store/support-telegram';
import { formatPrice, shippingInfo } from '@/lib/products';
import { PAID_PAYMENT_STATUSES, describePaymentStatus } from '@/lib/commerce';
import { getPublicOrderFn } from '@/lib/shop-api';

type ReturnSearch = { order?: string | undefined; t?: string | undefined; betalning?: string | undefined };

export const Route = createFileRoute('/kassa_/tack')({
  validateSearch: (search: Record<string, unknown>): ReturnSearch => ({
    order: typeof search['order'] === 'string' ? search['order'] : undefined,
    t: typeof search['t'] === 'string' ? search['t'] : undefined,
    betalning: typeof search['betalning'] === 'string' ? search['betalning'] : undefined,
  }),
  loaderDeps: ({ search }) => ({ order: search.order, t: search.t }),
  loader: ({ deps }) => (deps.order && deps.t ? getPublicOrderFn({ data: { ref: deps.order, token: deps.t } }) : null),
  head: () => seoHead({ title: 'Din beställning', description: 'Status för din beställning hos Peptidesweden.', path: '/kassa/tack', noindex: true }),
  component: ThankYouPage,
});

function ThankYouPage() {
  const order = Route.useLoaderData();
  const { betalning } = Route.useSearch();
  const router = useRouter();
  const paid = !!order && (order.status === 'betald' || order.status === 'skickad' || PAID_PAYMENT_STATUSES.includes(order.paymentStatus ?? ''));
  const failed = !!order && (order.status === 'avbruten' || ['failed', 'expired', 'refunded'].includes(order.paymentStatus ?? ''));
  const partial = order?.paymentStatus === 'partially_paid';
  const pending = !!order && !paid && !failed && !partial;

  // Blockchain confirmations take a few minutes; poll until NOWPayments reports a final status.
  useEffect(() => {
    if (!pending || betalning === 'avbruten') return;
    const timer = window.setInterval(() => void router.invalidate(), 15_000);
    return () => window.clearInterval(timer);
  }, [pending, betalning, router]);

  if (!order) {
    return (
      <main className="content-width kassa-page">
        <div className="kassa-done">
          <AlertTriangle size={48} />
          <h1>Vi hittar inte beställningen</h1>
          <p>Länken saknar uppgifter eller är felaktig. Kontakta oss med ditt ordernummer så hjälper vi dig.</p>
          <TelegramSupportRow note="Frågor om din beställning? Skriv till oss på Telegram" />
        </div>
      </main>
    );
  }

  const title = paid ? 'Tack – betalningen är mottagen!' : partial ? 'Betalningen är ofullständig' : failed || betalning === 'avbruten' ? 'Betalningen är inte genomförd' : 'Vi väntar på din betalning';
  const text = paid
    ? 'Din beställning packas nu och skickas med PostNord.'
    : partial
      ? 'Vi har tagit emot en del av beloppet. Kontakta oss på Telegram med ditt ordernummer så löser vi resten.'
      : failed
        ? 'Betalningen avbröts eller gick ut. Lägg en ny beställning eller kontakta oss om du redan har betalat.'
        : betalning === 'avbruten'
          ? 'Du avbröt betalningen. Du kan fortsätta betala via länken nedan så länge fakturan är giltig.'
          : 'När transaktionen har bekräftats på blockkedjan uppdateras sidan automatiskt. Det brukar ta några minuter.';

  return (
    <main className="content-width kassa-page">
      <section className="confirm-hero" aria-label="Beställningsstatus">
        <span className="confirm-badge">{paid ? <CheckCircle2 size={30} /> : failed || partial ? <AlertTriangle size={30} /> : <Clock size={30} />}</span>
        <div>
          <span className="eyebrow"><span className="eyebrow-line" /> Order {order.ref}</span>
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
      </section>
      <div className="confirm-main">
        <div className="confirm-card">
          <h2><Package size={15} /> Status</h2>
          <p className="confirm-carrier">Betalning: <strong>{describePaymentStatus(order.paymentStatus)}</strong></p>
          <p className="confirm-carrier">Summa: <strong>{formatPrice(order.total)}</strong></p>
          {pending && order.paymentUrl && (
            <Button asChild variant={betalning === 'avbruten' ? 'default' : 'outline'}><a href={order.paymentUrl}>Öppna betalsidan <ArrowRight /></a></Button>
          )}
        </div>
        <div className="confirm-card">
          <h2><Truck size={15} /> Leverans</h2>
          <p className="confirm-carrier">{shippingInfo.summary}</p>
        </div>
        <div className="kassa-actions confirm-actions">
          <Button asChild variant="outline"><Link to="/"><Home /> Till startsidan</Link></Button>
          <Button asChild><Link to="/produkter">Fortsätt handla <ArrowRight /></Link></Button>
        </div>
        <TelegramSupportRow note="Frågor om din beställning? Skriv till oss på Telegram" />
      </div>
    </main>
  );
}
