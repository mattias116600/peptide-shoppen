import { useState } from 'react';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ArrowRight, Plus, Minus, FlaskConical, ShieldAlert, Truck, FileText, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { findGroup, formatPrice } from '@/lib/products';
import { useStore } from '@/components/store/store-provider';
import vial from '@/assets/peptide-vial.jpg';

export const Route = createFileRoute('/produkter/$slug')({
  validateSearch: (search: Record<string, unknown>): { styrka?: string | undefined } => ({ styrka: typeof search['styrka'] === 'string' ? search['styrka'] : undefined }),
  loader: ({ params }) => { const product = findGroup(params.slug); if (!product) throw notFound(); return product; },
  head: ({ loaderData }) => ({ meta: [
    { title: `${loaderData?.name ?? 'Produkt'} för forskning | Peptidesweden` },
    { name: 'description', content: loaderData?.description ?? 'Forskningspeptider från Peptidesweden.' },
    { property: 'og:title', content: `${loaderData?.name ?? 'Produkt'} | Peptidesweden` },
    { property: 'og:description', content: 'Produktinformation för laboratorieforskning.' },
    { property: 'og:type', content: 'product' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Detail,
});

const mgOf = (amount: string) => parseFloat(amount.replace(',', '.'));

function Detail() {
  const product = Route.useLoaderData();
  const { styrka } = Route.useSearch();
  const navigate = Route.useNavigate();
  const variant = product.variants.find(v => v.slug === styrka) ?? product.variants[0];
  const [quantity, setQuantity] = useState(1);
  const { change, setCartOpen } = useStore();
  const total = variant.price * quantity;
  return (
    <main className="content-width">
      <div className="research-banner"><ShieldAlert size={18} /><p><strong>Forskningssubstans.</strong> Endast för laboratoriebruk. Ej avsedd för människor eller djur, förtäring eller injektion. Inga medicinska påståenden görs.</p></div>
      <nav className="breadcrumb"><Link to="/">Hem</Link><span>/</span><Link to="/produkter">Produkter</Link><span>/</span><span>{product.name}</span></nav>
      <div className="detail-grid pdp">
        <div className="pdp-media">
          <img className="detail-photo" src={vial} alt={`${product.name} forskningsvial`} width={1024} height={1024} />
          <span className="pdp-media-tag">{variant.amount}</span>
        </div>
        <div className="detail-copy">
          <div className="eyebrow"><FlaskConical size={15} /> {product.category.toUpperCase()} · ENDAST FÖR FORSKNING</div>
          <h1>{product.name}</h1>
          <div className="pdp-sku">Art.nr: PS-{product.slug.toUpperCase()}</div>
          <p className="detail-description">{product.description}</p>

          <div className="pdp-label">Storlek <span>{variant.amount}</span></div>
          <div className="size-grid" role="radiogroup" aria-label="Välj storlek">
            {product.variants.map(v => (
              <button key={v.slug} type="button" role="radio" aria-checked={v.slug === variant.slug} data-active={v.slug === variant.slug} className="size-tile" onClick={() => navigate({ search: { styrka: v.slug }, replace: true, resetScroll: false })}>
                <strong>{v.amount}</strong>
                <span>{formatPrice(v.price)}</span>
                <small>{formatPrice(Math.round(v.price / mgOf(v.amount)))}/mg</small>
              </button>
            ))}
          </div>

          <div className="pdp-buy">
            <div className="pdp-total"><span>Totalt</span><strong>{formatPrice(total)}</strong></div>
            <div className="detail-action">
              <div className="quantity-controls">
                <Button size="icon" variant="ghost" disabled={quantity === 1} aria-label="Minska antal" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus /></Button>
                <span>{quantity}</span>
                <Button size="icon" variant="ghost" aria-label="Öka antal" onClick={() => setQuantity(q => q + 1)}><Plus /></Button>
              </div>
              <Button onClick={() => { change(variant.slug, quantity); setCartOpen(true); }}>Lägg i varukorg — {formatPrice(total)} <ArrowRight /></Button>
            </div>
            <p className="detail-notice">Exempelpriser. Beställningar och betalningar är inte aktiverade ännu.</p>
          </div>

          <div className="pdp-info-cards">
            <div><FileText size={18} /><div><strong>Analysrapport</strong>{variant.coaUrl ? <p>Batch {variant.batch} — <a href={variant.coaUrl} target="_blank" rel="noopener noreferrer" className="coa-link">Visa analysrapport (CoA)</a></p> : <p>Batchspecifika rapporter publiceras när de finns tillgängliga.</p>}</div></div>
            <div><Truck size={18} /><div><strong>Leverans</strong><p>Fraktvillkor kommer snart.</p></div></div>
            <div><CreditCard size={18} /><div><strong>Betalning</strong><p>Betalningsalternativ är inte aktiverade ännu.</p></div></div>
          </div>

          <Accordion type="single" collapsible defaultValue="information">
            <AccordionItem value="information"><AccordionTrigger>Produktbeskrivning</AccordionTrigger><AccordionContent>Innehåll: {product.name}, {variant.amount}. {product.description} Endast för forskningsändamål. Bilden är en varumärkesillustration, inte en bild av en verifierad produktbatch.</AccordionContent></AccordionItem>
            <AccordionItem value="documentation"><AccordionTrigger>Analys & dokumentation</AccordionTrigger><AccordionContent>{variant.coaUrl ? <>Analysrapport för batch {variant.batch}: <a href={variant.coaUrl} target="_blank" rel="noopener noreferrer" className="coa-link">{variant.coaUrl}</a>. Rapporten tillhandahålls av en extern part.</> : 'Batchspecifika analysrapporter är ännu inte tillgängliga. Renhet eller tredjepartstestning påstås inte utan verifierad dokumentation.'}</AccordionContent></AccordionItem>
          </Accordion>
        </div>
      </div>
    </main>
  );
}
