import { useState } from 'react';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatPrice } from '@/lib/products';
import { describeDiscount, normalizeCode, type DiscountKind } from '@/lib/commerce';
import { createDiscountFn, deleteDiscountFn, listDiscountsFn, setDiscountActiveFn } from '@/lib/shop-api';
import { formatDateTime } from '@/components/admin/admin-ui';

export const Route = createFileRoute('/admin/rabattkoder')({
  loader: () => listDiscountsFn(),
  component: DiscountsPage,
});

const emptyForm = { code: '', kind: 'percent' as DiscountKind, value: '', minTotal: '', maxUses: '', expiresAt: '' };

function DiscountsPage() {
  const codes = Route.useLoaderData();
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const value = Number(form.value);
    if (!Number.isInteger(value) || value < 1) { setError('Ange ett heltal större än 0 som rabatt.'); return; }
    setBusy(true);
    try {
      const result = await createDiscountFn({
        data: {
          code: normalizeCode(form.code),
          kind: form.kind,
          value,
          minTotal: form.minTotal ? Number(form.minTotal) : 0,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          // The chosen date is inclusive: the code works until the end of that day, Swedish time.
          expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
        },
      });
      if (!result.ok) { setError(result.error); return; }
      setForm(emptyForm);
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error && err.message.includes('Koden') ? 'Koden får bara innehålla A–Z, 0–9, - och _ (3–32 tecken).' : 'Kunde inte skapa koden. Kontrollera fälten.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: number, active: boolean) => { await setDiscountActiveFn({ data: { id, active } }); await router.invalidate(); };
  const remove = async (id: number, code: string) => {
    if (!window.confirm(`Ta bort rabattkoden ${code}? Ordrar som redan använt den påverkas inte.`)) return;
    await deleteDiscountFn({ data: { id } });
    await router.invalidate();
  };

  return (
    <main className="admin-page">
      <div className="admin-heading"><h1>Rabattkoder</h1></div>

      <form className="admin-card admin-discount-form" onSubmit={create}>
        <h2>Ny rabattkod</h2>
        <div className="admin-form-grid">
          <label className="kassa-field"><span>Kod</span><input value={form.code} onChange={set('code')} placeholder="SOMMAR10" required maxLength={32} /></label>
          <label className="kassa-field"><span>Typ</span>
            <select value={form.kind} onChange={set('kind')}><option value="percent">Procent</option><option value="fixed">Fast belopp (kr)</option></select>
          </label>
          <label className="kassa-field"><span>{form.kind === 'percent' ? 'Rabatt (%)' : 'Rabatt (kr)'}</span><input type="number" min={1} max={form.kind === 'percent' ? 100 : undefined} value={form.value} onChange={set('value')} required /></label>
          <label className="kassa-field"><span>Minsta ordervärde (kr)</span><input type="number" min={0} value={form.minTotal} onChange={set('minTotal')} placeholder="0" /></label>
          <label className="kassa-field"><span>Max antal användningar</span><input type="number" min={1} value={form.maxUses} onChange={set('maxUses')} placeholder="Obegränsat" /></label>
          <label className="kassa-field"><span>Giltig till och med</span><input type="date" value={form.expiresAt} onChange={set('expiresAt')} /></label>
        </div>
        {error && <p className="kassa-error" role="alert">{error}</p>}
        <Button type="submit" disabled={busy}><Plus /> Skapa kod</Button>
      </form>

      {codes.length === 0 ? (
        <p className="admin-empty">Inga rabattkoder ännu.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Kod</th><th>Rabatt</th><th>Villkor</th><th>Använd</th><th>Giltig till</th><th>Aktiv</th><th /></tr></thead>
            <tbody>
              {codes.map(c => {
                const expired = !!c.expiresAt && new Date(c.expiresAt) < new Date();
                return (
                  <tr key={c.id} data-inactive={!c.active || expired}>
                    <td><code className="admin-code">{c.code}</code></td>
                    <td>{describeDiscount(c)}</td>
                    <td>{c.minTotal ? `Från ${formatPrice(c.minTotal)}` : '—'}</td>
                    <td>{c.uses}{c.maxUses !== null ? ` / ${c.maxUses}` : ''}</td>
                    <td>{c.expiresAt ? `${formatDateTime(c.expiresAt).split(' ')[0]}${expired ? ' (utgången)' : ''}` : '—'}</td>
                    <td><Switch checked={c.active} onCheckedChange={v => toggle(c.id, v)} aria-label={`Aktivera ${c.code}`} /></td>
                    <td><Button size="icon" variant="ghost" aria-label={`Ta bort ${c.code}`} onClick={() => remove(c.id, c.code)}><Trash2 /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
