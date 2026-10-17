import { useState } from 'react';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwedenFlag } from '@/components/store/sweden-flag';
import { loginFn } from '@/lib/shop-api';

export const Route = createFileRoute('/admin/login')({
  head: () => ({ meta: [{ title: 'Logga in — Peptidesweden admin' }] }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await loginFn({ data: { username, password } });
      if (!result.ok) { setError(result.error); setPassword(''); return; }
      await router.invalidate();
      await router.navigate({ to: '/admin' });
    } catch {
      setError('Något gick fel. Försök igen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <div className="brand admin-brand"><span className="brand-mark" aria-hidden="true"><SwedenFlag /></span><span>peptide<span>sweden</span></span></div>
        <h1><LockKeyhole size={18} /> Admin-inloggning</h1>
        <label className="kassa-field"><span>Användarnamn</span>
          <input autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
        </label>
        <label className="kassa-field"><span>Lösenord</span>
          <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {error && <p className="kassa-error" role="alert">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'Loggar in…' : 'Logga in'}</Button>
        <p className="admin-muted">Konton skapas på servern med <code>npm run admin -- create &lt;namn&gt;</code>.</p>
      </form>
    </main>
  );
}
