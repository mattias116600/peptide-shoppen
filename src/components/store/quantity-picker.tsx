import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAX_LINE_QUANTITY } from '@/lib/commerce';

/** Quantity on the product page: quick-pick buttons plus an own amount when the product has presets, otherwise +/–. */
export function QuantityPicker({ value, onChange, presets }: { value: number; onChange: (n: number) => void; presets: number[] }) {
  const custom = !presets.includes(value);
  const [text, setText] = useState(custom ? String(value) : '');
  useEffect(() => { if (presets.includes(value)) setText(''); }, [value, presets]);

  if (!presets.length) {
    return (
      <div className="quantity-controls">
        <Button size="icon" variant="ghost" disabled={value === 1} aria-label="Minska antal" onClick={() => onChange(Math.max(1, value - 1))}><Minus /></Button>
        <span>{value}</span>
        <Button size="icon" variant="ghost" disabled={value >= MAX_LINE_QUANTITY} aria-label="Öka antal" onClick={() => onChange(Math.min(MAX_LINE_QUANTITY, value + 1))}><Plus /></Button>
      </div>
    );
  }

  return (
    <div className="quantity-presets" role="group" aria-label="Välj antal">
      {presets.map(n => (
        <Button key={n} type="button" variant="outline" className="quantity-preset" data-active={value === n} aria-pressed={value === n} onClick={() => onChange(n)}>{n} st</Button>
      ))}
      <label className="quantity-custom" data-active={custom}>
        <span>Eget antal</span>
        <input
          type="number" inputMode="numeric" min={1} max={MAX_LINE_QUANTITY} step={1} placeholder="Antal" value={text}
          onChange={e => {
            setText(e.target.value);
            const n = Math.floor(Number(e.target.value));
            if (n >= 1) onChange(Math.min(MAX_LINE_QUANTITY, n));
          }}
          onBlur={() => { if (!text || Number(text) < 1) { setText(''); if (custom) onChange(presets[0]!); } }}
        />
        <span aria-hidden="true">st</span>
      </label>
    </div>
  );
}
