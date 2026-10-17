import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Bitcoin, Check, CheckCircle2, CreditCard, FlaskConical, Home, ListChecks, Mail, Minus, Package, Phone, Plus, ShoppingBag, TicketPercent, Truck, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/components/store/store-provider';
import { products, formatPrice, cartTotal, shippingInfo, isValidPhone } from '@/lib/products';
import { TelegramSupportRow } from '@/components/store/support-telegram';
import vial from '@/assets/peptide-vial.webp';
import { checkDiscountFn, getCheckoutConfigFn, placeOrderFn } from '@/lib/shop-api';
import type { PlacedOrder } from '@/lib/commerce';

export const Route = createFileRoute('/kassa')({
  head: () => ({
    meta: [
      { title: 'Kassa — Peptidesweden' },
      { name: 'description', content: 'Slutför din beställning hos Peptidesweden i tre enkla steg: varukorg, uppgifter och betalning.' },
      { property: 'og:title', content: 'Kassa — Peptidesweden' },
      { property: 'og:description', content: 'Slutför din beställning i tre enkla steg.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  loader: () => getCheckoutConfigFn(),
  component: CheckoutPage,
});

const steps = [
  { label: 'Varukorg', icon: ShoppingBag },
  { label: 'Uppgifter', icon: User },
  { label: 'Betalning', icon: CreditCard },
];

const autoComplete: Record<string, string> = {
  name: 'name',
  email: 'email',
  phone: 'tel',
  address: 'street-address',
  zip: 'postal-code',
  city: 'address-level2',
};

function StepBar({ current }: { current: number }) {
  return (
    <ol className="checkout-steps" aria-label="Steg i kassan">
      {steps.map((s, i) => (
        <li key={s.label} data-state={i < current ? 'done' : i === current ? 'active' : 'todo'}>
          <span className="checkout-step-dot">{i < current ? <Check size={14} /> : i + 1}</span>
          <span className="checkout-step-label">{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

function CheckoutPage() {
  const { items, change, clear } = useStore();
  const { cryptoPayments } = Route.useLoaderData();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', zip: '', city: '' });
  const [touched, setTouched] = useState(false);
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [discount, setDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const subtotal = cartTotal(items);
  const total = subtotal - (discount?.amount ?? 0);

  const applyCode = async (code: string) => {
    setDiscountError('');
    if (!code.trim()) return;
    try {
      const result = await checkDiscountFn({ data: { code, cart: items } });
      if (result.ok) setDiscount({ code: result.value.code, amount: result.value.amount });
      else { setDiscount(null); setDiscountError(result.error); }
    } catch {
      setDiscount(null);
      setDiscountError('Kunde inte kontrollera koden just nu.');
    }
  };

  // Re-price the code whenever the cart changes, since percentages and minimum totals depend on it.
  useEffect(() => {
    if (discount && items.length) void applyCode(discount.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const submitOrder = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await placeOrderFn({ data: { customer: form, cart: items, ...(discount ? { discountCode: discount.code } : {}) } });
      if (!result.ok) { setSubmitError(result.error); return; }
      clear();
      if (result.value.paymentUrl) {
        // Hand over to NOWPayments' hosted payment page; it returns to /kassa/tack afterwards.
        window.location.assign(result.value.paymentUrl);
        return;
      }
      setOrder(result.value.order);
      setDone(true);
    } catch {
      setSubmitError('Beställningen kunde inte skickas. Kontrollera uppgifterna och försök igen, eller kontakta oss på Telegram.');
    } finally {
      setSubmitting(false);
    }
  };
  const phoneValid = isValidPhone(form.phone);
  const formValid = !!form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && phoneValid && !!form.address.trim() && !!form.zip.trim() && !!form.city.trim();

  if (done && order) {
    const placed = new Date().toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });
    return (
      <main className="content-width kassa-page">
        <section className="confirm-hero" aria-label="Beställning mottagen">
          <span className="confirm-badge"><CheckCircle2 size={30} /></span>
          <div>
            <span className="eyebrow"><span className="eyebrow-line" /> Beställning mottagen</span>
            <h1>Tack för din beställning!</h1>
            <p>Bekräftelse skickas till <strong>{order.email}</strong>. Nedan ser du vad som händer nu.</p>
          </div>
        </section>
        <div className="confirm-main">
          <div className="confirm-card">
            <h2><Truck size={15} /> Leverans</h2>
            <p className="confirm-carrier">Skickas med <strong>PostNord</strong> i neutral förpackning — leverans <strong>1–3 arbetsdagar</strong>.</p>
            <p className="confirm-address">{order.name}<br />{order.address}<br />{order.zip} {order.city}<br /><Phone size={12} /> {order.phone}</p>
          </div>
          <div className="confirm-card">
            <h2><ListChecks size={15} /> Vad händer nu?</h2>
            <ol className="confirm-steps">
              <li><span>1</span>Orderbekräftelse skickas till {order.email}.</li>
              <li><span>2</span>Din beställning packas i neutral förpackning.</li>
              <li><span>3</span>Skickas med PostNord — leverans 1–3 arbetsdagar.</li>
            </ol>
          </div>
          <div className="research-banner">
            <FlaskConical size={15} />
            <p>Alla produkter säljs endast för laboratorieforskning.</p>
          </div>
          <div className="kassa-actions confirm-actions">
            <Button asChild variant="outline"><Link to="/"><Home /> Till startsidan</Link></Button>
            <Button asChild><Link to="/produkter">Fortsätt handla <ArrowRight /></Link></Button>
          </div>
        </div>
        <aside className="kassa-summary confirm-summary" aria-label="Ordersammanfattning">
          <div className="confirm-meta">
            <span><Package size={13} /> Ordernummer {order.ref}</span>
            <span><Mail size={13} /> Beställd {placed}</span>
          </div>
          <h2>Din beställning</h2>
          {order.lines.map(l => (
            <div key={l.slug}><span>{l.name} {l.amount} × {l.qty}</span><span>{formatPrice(l.unitPrice * l.qty)}</span></div>
          ))}
          {order.discountCode && <div className="kassa-discount-line"><span>Rabatt ({order.discountCode})</span><span>−{formatPrice(order.discountAmount)}</span></div>}
          <div className="kassa-summary-total"><span>Totalt</span><strong>{formatPrice(order.total)}</strong></div>
          <p className="kassa-shipping"><Truck size={14} /> {shippingInfo.summary}</p>
          <TelegramSupportRow note="Frågor om din beställning? Skriv till oss på Telegram" />
        </aside>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="content-width kassa-page">
        <div className="kassa-done">
          <ShoppingBag size={56} />
          <h1>Din varukorg är tom</h1>
          <p>Lägg till produkter innan du går till kassan.</p>
          <Button asChild size="lg"><Link to="/produkter">Utforska produkter <ArrowRight /></Link></Button>
        </div>
      </main>
    );
  }

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '', invalid?: boolean) => (
    <label className="kassa-field">
      <span>{label}</span>
      <input
        type={type}
        inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : undefined}
        autoComplete={autoComplete[key]}
        maxLength={type === 'tel' ? 25 : undefined}
        value={form[key]}
        placeholder={placeholder}
        aria-invalid={touched && (invalid ?? !form[key].trim()) ? true : undefined}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
    </label>
  );

  return (
    <main className="content-width kassa-page">
      <div className="page-top">
        <span className="eyebrow"><span className="eyebrow-line" /> Kassa</span>
        <h1>Slutför din beställning</h1>
      </div>
      <StepBar current={step} />

      {step === 0 && (
        <section aria-label="Steg 1: Varukorg">
          <div className="kassa-items">
            {items.map(item => {
              const p = products.find(p => p.slug === item.slug);
              if (!p) return null;
              return (
                <div className="cart-item" key={p.slug}>
                  <img src={vial} alt={p.name} width={80} height={80} />
                  <div>
                    <h3>{p.name}</h3>
                    <p>{p.amount}</p>
                    <div className="quantity-controls">
                      <Button variant="ghost" size="icon" aria-label={`Minska ${p.name}`} onClick={() => change(p.slug, -1)}><Minus /></Button>
                      <span>{item.quantity}</span>
                      <Button variant="ghost" size="icon" aria-label={`Öka ${p.name}`} onClick={() => change(p.slug, 1)}><Plus /></Button>
                    </div>
                  </div>
                  <strong>{formatPrice(p.price * item.quantity)}</strong>
                </div>
              );
            })}
          </div>
          <div className="kassa-actions">
            <Button asChild variant="outline"><Link to="/produkter"><ArrowLeft /> Fortsätt handla</Link></Button>
            <Button onClick={() => setStep(1)}>Gå vidare till uppgifter <ArrowRight /></Button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section aria-label="Steg 2: Uppgifter">
          <div className="kassa-form">
            {field('name', 'Namn', 'text', 'För- och efternamn')}
            <div className="kassa-form-row">
              {field('email', 'E-post', 'email', 'namn@exempel.se')}
              {field('phone', 'Telefon', 'tel', '070 123 45 67', !phoneValid)}
            </div>
            {field('address', 'Adress', 'text', 'Gatuadress')}
            <div className="kassa-form-row">
              {field('zip', 'Postnummer', 'text', '123 45')}
              {field('city', 'Ort', 'text', 'Stockholm')}
            </div>
            <p className="kassa-hint"><Phone size={12} /> Telefonnumret används om PostNord behöver nå dig inför leveransen.</p>
            {touched && !formValid && <p className="kassa-error" role="alert">Fyll i alla fält med giltiga uppgifter för att gå vidare.</p>}
            {touched && !phoneValid && form.phone.trim() !== '' && (
              <p className="kassa-error" role="alert">Ange ett giltigt telefonnummer, till exempel 070 123 45 67 eller +46 70 123 45 67.</p>
            )}
          </div>
          <div className="kassa-actions">
            <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft /> Tillbaka</Button>
            <Button onClick={() => { setTouched(true); if (formValid) setStep(2); }}>Gå vidare till betalning <ArrowRight /></Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section aria-label="Steg 3: Betalning">
          <div className="kassa-review">
            <div className="kassa-review-box">
              <h2>Leverans</h2>
              <p>{form.name}<br />{form.address}<br />{form.zip} {form.city}<br /><Phone size={13} /> {form.phone}</p>
              <p className="kassa-shipping"><Truck size={14} /> {shippingInfo.summary}</p>
            </div>
            <div className="kassa-review-box">
              <h2>Betalning</h2>
              {cryptoPayments ? (
                <>
                  <p><Bitcoin size={14} /> Kryptovaluta via NOWPayments</p>
                  <p className="kassa-note">Du skickas till NOWPayments säkra betalsida och väljer där valuta, t.ex. Bitcoin eller USDT. Priset räknas om från kronor när du betalar.</p>
                </>
              ) : (
                <>
                  <p><CreditCard size={14} /> Betalning efter beställning</p>
                  <p className="kassa-note">Vi kontaktar dig med betalningsinstruktioner när beställningen är mottagen.</p>
                </>
              )}
            </div>
          </div>
          <div className="kassa-actions">
            <Button variant="outline" onClick={() => setStep(1)} disabled={submitting}><ArrowLeft /> Tillbaka</Button>
            <Button onClick={submitOrder} disabled={submitting}>{submitting ? (cryptoPayments ? 'Skapar betalning…' : 'Skickar beställning…') : <>{cryptoPayments ? 'Gå till betalning' : 'Slutför beställning'} — {formatPrice(total)} <Check /></>}</Button>
          </div>
          {submitError && <p className="kassa-error" role="alert">{submitError}</p>}
        </section>
      )}

      <aside className="kassa-summary" aria-label="Ordersammanfattning">
        <h2>Summa</h2>
        {items.map(item => {
          const p = products.find(p => p.slug === item.slug);
          if (!p) return null;
          return <div key={p.slug}><span>{p.name} {p.amount} × {item.quantity}</span><span>{formatPrice(p.price * item.quantity)}</span></div>;
        })}
        {discount ? (
          <div className="kassa-discount-line">
            <span><TicketPercent size={13} /> {discount.code}
              <button type="button" className="kassa-discount-remove" aria-label="Ta bort rabattkod" onClick={() => { setDiscount(null); setCodeInput(''); }}><X size={13} /></button>
            </span>
            <span>−{formatPrice(discount.amount)}</span>
          </div>
        ) : (
          <form className="kassa-discount" onSubmit={e => { e.preventDefault(); void applyCode(codeInput); }}>
            <input value={codeInput} onChange={e => setCodeInput(e.target.value)} placeholder="Rabattkod" aria-label="Rabattkod" maxLength={32} autoCapitalize="characters" />
            <Button type="submit" size="sm" variant="outline" disabled={!codeInput.trim()}>Använd</Button>
          </form>
        )}
        {discountError && <p className="kassa-error" role="alert">{discountError}</p>}
        <div className="kassa-summary-total"><span>Totalt</span><strong>{formatPrice(total)}</strong></div>
        <p className="kassa-shipping"><Truck size={14} /> {shippingInfo.summary}</p>
        <TelegramSupportRow note="Frågor innan du beställer? Skriv till oss på Telegram" />
      </aside>
    </main>
  );
}
