import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CreditCard, FlaskConical, Home, ListChecks, Mail, Minus, Package, Plus, ShoppingBag, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/components/store/store-provider';
import { products, formatPrice, cartTotal, shippingInfo } from '@/lib/products';
import { TelegramSupportRow } from '@/components/store/support-telegram';
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
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const total = cartTotal(items);
  const formValid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.address.trim() && form.zip.trim() && form.city.trim();

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
            <p className="confirm-address">{order.name}<br />{order.address}<br />{order.zip} {order.city}</p>
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
            <div key={l.name + l.amount}><span>{l.name} {l.amount} × {l.qty}</span><span>{formatPrice(l.price * l.qty)}</span></div>
          ))}
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
            <Button onClick={() => {
              setOrder({
                ref: `PSW-${Math.floor(10000 + Math.random() * 90000)}`,
                email: form.email,
                name: form.name,
                address: form.address,
                zip: form.zip,
                city: form.city,
                total,
                lines: items.map(i => {
                  const p = products.find(pp => pp.slug === i.slug);
                  return p ? { name: p.name, amount: p.amount, qty: i.quantity, price: p.price } : null;
                }).filter((l): l is NonNullable<typeof l> => l !== null),
              });
              clear();
              setDone(true);
            }}>Slutför beställning — {formatPrice(total)} <Check /></Button>
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
        <TelegramSupportRow note="Frågor innan du beställer? Skriv till oss på Telegram" />
      </aside>
    </main>
  );
}
