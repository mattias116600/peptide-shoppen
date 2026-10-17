import { createFileRoute, Link, Outlet, redirect, useRouter, useRouterState } from '@tanstack/react-router';
import { LogOut, Package, TicketPercent, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwedenFlag } from '@/components/store/sweden-flag';
import { getAdminFn, logoutFn } from '@/lib/shop-api';

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [{ title: 'Admin — Peptidesweden' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  beforeLoad: async ({ location }) => {
    const admin = await getAdminFn();
    const onLogin = location.pathname === '/admin/login';
    if (onLogin && admin) throw redirect({ to: '/admin' });
    if (!onLogin && !admin) throw redirect({ to: '/admin/login' });
    return { admin };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { admin } = Route.useRouteContext();
  const router = useRouter();
  const onLogin = useRouterState({ select: s => s.location.pathname === '/admin/login' });
  if (onLogin || !admin) return <Outlet />;

  const logout = async () => {
    await logoutFn();
    await router.invalidate();
    await router.navigate({ to: '/admin/login' });
  };

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <Link to="/admin" className="brand admin-brand"><span className="brand-mark" aria-hidden="true"><SwedenFlag /></span><span>peptide<span>sweden</span></span><em>Admin</em></Link>
        <nav className="admin-nav" aria-label="Admin">
          <Link to="/admin" activeOptions={{ exact: true, includeSearch: false }}><Package size={16} /> Ordrar</Link>
          <Link to="/admin/rabattkoder"><TicketPercent size={16} /> Rabattkoder</Link>
        </nav>
        <div className="admin-user">
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin-site-link"><ExternalLink size={14} /> Butiken</a>
          <span>{admin.username}</span>
          <Button size="sm" variant="outline" onClick={logout}><LogOut /> Logga ut</Button>
        </div>
      </header>
      <div className="admin-body"><Outlet /></div>
    </div>
  );
}
