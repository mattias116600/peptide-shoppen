import { useState } from 'react';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ArrowRight, Plus, Minus, FlaskConical, ShieldAlert, Truck, FileText, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { findGroup, formatPrice, productGroups, peptideInfo, shippingInfo } from '@/lib/products';
import { articles } from '@/lib/articles';
import { useStore } from '@/components/store/store-provider';
import { ProductCard } from '@/components/store/product-card';
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
              <Button variant="outline" key={v.slug} type="button" role="radio" aria-checked={v.slug === variant.slug} data-active={v.slug === variant.slug} className="size-tile" onClick={() => navigate({ search: { styrka: v.slug }, replace: true, resetScroll: false })}>
                <strong>{v.amount}</strong>
                <span>{formatPrice(v.price)}</span>
                <small>{formatPrice(Math.round(v.price / mgOf(v.amount)))}/mg</small>
              </Button>
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
            <p className="detail-delivery"><Truck size={14} /> {shippingInfo.summary}</p>
            <p className="detail-notice">Exempelpriser. Beställningar och betalningar är inte aktiverade ännu.</p>
          </div>

          <div className="pdp-info-cards">
            <div><FileText size={18} /><div><strong>Analysrapport</strong>{variant.coaUrl ? <p>Batch {variant.batch} — <a href={variant.coaUrl} target="_blank" rel="noopener noreferrer" className="coa-link">Visa analysrapport (CoA)</a></p> : <p>Batchspecifika rapporter publiceras när de finns tillgängliga.</p>}</div></div>
            <div><Truck size={18} /><div><strong>Leverans</strong><p>{shippingInfo.summary}</p></div></div>
            <div><CreditCard size={18} /><div><strong>Betalning</strong><p>Betalningsalternativ är inte aktiverade ännu.</p></div></div>
          </div>

          <Accordion type="single" collapsible defaultValue="information">
            <AccordionItem value="information"><AccordionTrigger>Produktbeskrivning</AccordionTrigger><AccordionContent>Innehåll: {product.name}, {variant.amount}. {product.description} Endast för forskningsändamål. Bilden är en varumärkesillustration, inte en bild av en verifierad produktbatch.</AccordionContent></AccordionItem>
          </Accordion>
        </div>
      </div>

      <section className="pdp-section">
        <Tabs defaultValue="om">
          <TabsList className="pdp-tabs">
            <TabsTrigger value="om">Beskrivning</TabsTrigger>
            <TabsTrigger value="spec">Specifikationer</TabsTrigger>
            <TabsTrigger value="forvaring">Förvaring</TabsTrigger>
            <TabsTrigger value="kvalitet">Kvalitet</TabsTrigger>
          </TabsList>
          <TabsContent value="om" className="pdp-tab-body"><h2>Om {product.name}</h2><p>{product.description}</p>{peptideInfo[product.slug]?.about.map(t => <p key={t}>{t}</p>)}<p>Produkten säljs uteslutande för laboratorie- och forskningsändamål. Inga medicinska påståenden görs.</p></TabsContent>
          <TabsContent value="spec" className="pdp-tab-body"><h2>Specifikationer</h2><table className="pdp-spec"><tbody>
            <tr><th>Produkt</th><td>{product.name}</td></tr>
            <tr><th>Styrka</th><td>{variant.amount}</td></tr>
            <tr><th>Tillgängliga styrkor</th><td>{product.variants.map(v => v.amount).join(', ')}</td></tr>
            {peptideInfo[product.slug]?.specs.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
            <tr><th>Renhet</th><td>Se batchens analysrapport</td></tr>
            <tr><th>Förvaring</th><td>Torrt, mörkt, −20 °C för långtidsförvaring</td></tr>
            <tr><th>Kategori</th><td>{product.category}</td></tr>
            <tr><th>Form</th><td>Lyofiliserat pulver</td></tr>
            <tr><th>Batch</th><td>{variant.batch ?? 'Publiceras senare'}</td></tr>
          </tbody></table></TabsContent>
          <TabsContent value="forvaring" className="pdp-tab-body"><h2>Förvaring</h2><p>Förvaras torrt, mörkt och kallt enligt laboratoriets rutiner. Undvik upprepad frysning och upptining.</p></TabsContent>
          <TabsContent value="kvalitet" className="pdp-tab-body"><h2>Kvalitet & dokumentation</h2><p>{variant.coaUrl ? <>Analysrapport för batch {variant.batch}: <a href={variant.coaUrl} target="_blank" rel="noopener noreferrer" className="coa-link">Visa CoA</a>.</> : 'Batchspecifik analysrapport publiceras när den finns tillgänglig.'}</p></TabsContent>
        </Tabs>
      </section>

      <section className="pdp-section">
        <div className="eyebrow">VARFÖR PEPTIDESWEDEN</div>
        <h2 className="pdp-h2">Därför väljer forskare oss</h2>
        <div className="pdp-why">
          {[['Tydlig dokumentation','Analysrapporter länkas per batch när de finns.'],['Svensk kundtjänst','Frågor besvaras på svenska.'],['Diskret förpackning','Neutral förpackning skickad med PostNord.'],['Endast forskning','Vi säljer enbart för laboratoriebruk.']].map(([t,d]) => <div key={t}><strong>{t}</strong><p>{d}</p></div>)}
        </div>
      </section>

      <section className="pdp-section">
        <h2 className="pdp-h2">Vanliga frågor</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="a"><AccordionTrigger>Är produkten avsedd för människor?</AccordionTrigger><AccordionContent>Nej. Produkten är endast för laboratorieforskning.</AccordionContent></AccordionItem>
          <AccordionItem value="b"><AccordionTrigger>Var hittar jag analysrapporten?</AccordionTrigger><AccordionContent>Under fliken Kvalitet ovan, när en rapport finns för vald styrka.</AccordionContent></AccordionItem>
          <AccordionItem value="c"><AccordionTrigger>Hur räknar jag koncentration?</AccordionTrigger><AccordionContent>Använd vår <Link to="/kalkylator" className="coa-link">kalkylator</Link> för mg/ml.</AccordionContent></AccordionItem>
        </Accordion>
      </section>

      <section className="pdp-section">
        <h2 className="pdp-h2">Relaterade artiklar</h2>
        <div className="pdp-related">
          {[...articles].sort((a, b) => Number(b.productSlug === product.slug) - Number(a.productSlug === product.slug)).slice(0, 3).map(a => <Link key={a.slug} to="/blogg/$slug" params={{ slug: a.slug }}><span>{a.category}</span><strong>{a.title}</strong></Link>)}
        </div>
      </section>

      <section className="pdp-section">
        <h2 className="pdp-h2">Andra forskare tittade även på</h2>
        <div className="product-grid">{productGroups.filter(g => g.slug !== product.slug).slice(0, 4).map(g => <ProductCard key={g.slug} product={g} />)}</div>
      </section>

      <div className="pdp-sticky">
        <div><strong>{product.name} {variant.amount}</strong><span>{formatPrice(total)}</span></div>
        <Button onClick={() => { change(variant.slug, quantity); setCartOpen(true); }}>Lägg i varukorg</Button>
      </div>
    </main>
  );
}
