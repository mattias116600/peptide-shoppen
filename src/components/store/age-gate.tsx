import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwedenFlag } from './sweden-flag';

const KEY = 'peptidesweden-age-verified';

export function AgeGate() {
  const [status, setStatus] = useState<'checking' | 'open' | 'ok' | 'denied'>('checking');
  useEffect(() => { setStatus(localStorage.getItem(KEY) === 'yes' ? 'ok' : 'open'); }, []);
  useEffect(() => {
    document.body.style.overflow = status === 'ok' ? '' : 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [status]);
  if (status === 'ok') return null;
  return (
    <div className="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-gate-title">
      {status !== 'checking' && (
        <div className="age-gate-card">
          <div className="brand"><span className="brand-mark" aria-hidden="true"><SwedenFlag /></span><span>peptide<span>sweden</span></span></div>
          <div className="age-gate-icon"><ShieldCheck size={30} /></div>
          {status === 'open' ? <>
            <h2 id="age-gate-title">Ålderskontroll</h2>
            <p>Du måste vara minst 18 år för att besöka Peptidesweden. Alla produkter är endast avsedda för laboratorieforskning.</p>
            <div className="age-gate-actions">
              <Button onClick={() => { localStorage.setItem(KEY, 'yes'); setStatus('ok'); }}>Jag är 18 år eller äldre</Button>
              <Button variant="outline" onClick={() => setStatus('denied')}>Jag är under 18</Button>
            </div>
          </> : <>
            <h2 id="age-gate-title">Åtkomst nekad</h2>
            <p>Du måste vara minst 18 år för att besöka den här sidan.</p>
            <Button variant="outline" onClick={() => setStatus('open')}>Tillbaka</Button>
          </>}
        </div>
      )}
    </div>
  );
}
