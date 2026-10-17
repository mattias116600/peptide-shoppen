import { useRef, useState } from 'react';
import { ImageOff, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bundledImages, resolveImage } from '@/lib/media';

/** Pick an image: upload a new one or reuse one shipped with the site. Value is an image key (see src/lib/media.ts). */
export function ImagePicker({ value, onChange, allowNone = false, label = 'Bild' }: { value: string; onChange: (key: string) => void; allowNone?: boolean; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body, credentials: 'same-origin' });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Uppladdningen misslyckades.');
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Uppladdningen misslyckades.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="admin-image-picker">
      <span className="admin-field-label">{label}</span>
      <div className="admin-image-row">
        <div className="admin-image-preview">{value ? <img src={resolveImage(value)} alt="" /> : <ImageOff size={22} />}</div>
        <div className="admin-image-actions">
          <input ref={input} type="file" accept="image/webp,image/png,image/jpeg" hidden onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload /> {busy ? 'Laddar upp…' : 'Ladda upp bild'}</Button>
          <select value={value.startsWith('bundled:') ? value : ''} onChange={e => e.target.value ? onChange(e.target.value) : allowNone ? onChange('') : undefined} aria-label="Välj befintlig bild">
            <option value="">{value.startsWith('/media/') ? 'Uppladdad bild' : allowNone ? 'Ingen bild' : 'Välj befintlig bild…'}</option>
            {Object.keys(bundledImages).map(k => <option key={k} value={`bundled:${k}`}>{k === 'vial' ? 'Standardvial' : k}</option>)}
          </select>
          {allowNone && value && <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>Ta bort bild</Button>}
          <small className="admin-muted">WebP, PNG eller JPEG, max 5 MB.</small>
        </div>
      </div>
      {error && <p className="kassa-error" role="alert">{error}</p>}
    </div>
  );
}
