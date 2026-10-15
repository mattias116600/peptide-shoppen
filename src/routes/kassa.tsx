import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CreditCard, FlaskConical, Home, ListChecks, Mail, Minus, Package, Plus, ShoppingBag, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/components/store/store-provider';
import { products, formatPrice, cartTotal, shippingInfo } from '@/lib/products';
import vial from '@/assets/peptide-vial.jpg';

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
  component: CheckoutPage,
});

type PlacedOrder = {
  ref: string;
  email: string;
  name: string;
  address: string;
  zip: string;
  city: string;
  total: number;
  lines: { name: string; amount: string; qty: number; price: number }[];
};

const steps = [
  { label: 'Varukorg', icon: ShoppingBag },
  { label: 'Uppgifter', icon: User },
  { label: 'Betalning', icon: CreditCard },
];

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
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', address: '', zip: '', city: '' });
  const [touched, setTouched] = useState(false);
  const total = cartTotal(items);
  const formValid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.address.trim() && form.zip.trim() && form.city.trim();

  if (done) {
    return (
      <main className="content-width kassa-page">
        <div className="kassa-done">
          <CheckCircle2 size={56} />
          <h1>Tack för din beställning!</h1>
          <p>Din beställning är mottagen. En bekräftelse skickas till {form.email}.</p>
          <p className="kassa-done-shipping"><Truck size={15} /> {shippingInfo.summary}</p>
          <Button asChild size="lg"><Link to="/produkter">Fortsätt handla <ArrowRight /></Link></Button>
        </div>
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

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <label className="kassa-field">
      <span>{label}</span>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        aria-invalid={touched && !form[key].trim() ? true : undefined}
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
            {field('email', 'E-post', 'email', 'namn@exempel.se')}
            {field('address', 'Adress', 'text', 'Gatuadress')}
            <div className="kassa-form-row">
              {field('zip', 'Postnummer', 'text', '123 45')}
              {field('city', 'Ort', 'text', 'Stockholm')}
            </div>
            {touched && !formValid && <p className="kassa-error" role="alert">Fyll i alla fält med giltiga uppgifter för att gå vidare.</p>}
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
              <p>{form.name}<br />{form.address}<br />{form.zip} {form.city}</p>
              <p className="kassa-shipping"><Truck size={14} /> {shippingInfo.summary}</p>
            </div>
            <div className="kassa-review-box">
              <h2>Betalning</h2>
              <p><CreditCard size={14} /> Kortbetalning</p>
              <p className="kassa-note">Betalningen genomförs säkert i nästa steg.</p>
            </div>
          </div>
          <div className="kassa-actions">
            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft /> Tillbaka</Button>
            <Button onClick={() => { clear(); setDone(true); }}>Slutför beställning — {formatPrice(total)} <Check /></Button>
          </div>
        </section>
      )}

      <aside className="kassa-summary" aria-label="Ordersammanfattning">
        <h2>Summa</h2>
        {items.map(item => {
          const p = products.find(p => p.slug === item.slug);
          if (!p) return null;
          return <div key={p.slug}><span>{p.name} {p.amount} × {item.quantity}</span><span>{formatPrice(p.price * item.quantity)}</span></div>;
        })}
        <div className="kassa-summary-total"><span>Totalt</span><strong>{formatPrice(total)}</strong></div>
        <p className="kassa-shipping"><Truck size={14} /> {shippingInfo.summary}</p>
      </aside>
    </main>
  );
}
