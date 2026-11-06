'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutGrid, UserRound, ShieldCheck, Menu, LogOut, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/ui';
import s from './dashboard.module.css';
import { Selector } from '@/components/workspace/forms';
import type { listWorkspaces } from '@/server/workspace/access';
import { Building2, Users, Settings } from 'lucide-react';

const links = [
  { url: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { url: '/dashboard/workspace', label: 'Workspace overview', icon: Building2 },
  { url: '/dashboard/team', label: 'Team', icon: Users },
  { url: '/dashboard/settings/routing', label: 'Routing settings', icon: Settings },
  { url: '/dashboard/leads', label: 'Leads', icon: LayoutGrid },
  { url: '/dashboard/lead-forms', label: 'Enquiry forms', icon: Settings },
  { url: '/dashboard/settings/workspace', label: 'Workspace settings', icon: Settings },
  { url: '/dashboard/settings/marketing', label: 'Website enquiries', icon: Settings },
  { url: '/dashboard/settings/profile', label: 'Account settings', icon: UserRound },
  { url: '/dashboard/settings/security', label: 'Security settings', icon: ShieldCheck },
];
export function DashboardShell({
  name,
  children,
  rows,
  active,
}: {
  name: string;
  children: React.ReactNode;
  rows: Awaited<ReturnType<typeof listWorkspaces>>;
  active?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!r.ok) throw new Error();
      window.location.replace('/login');
    } catch {
      setBusy(false);
      setError('Could not sign out. Please try again.');
    }
  }
  const signout = (
    <button type="button" onClick={logout} disabled={busy}>
      <LogOut size={17} />
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
  return (
    <div className={s.shell}>
      <aside className={s.side}>
        <div className={s.brand}>
          <Logo />
          <button
            className={s.mobile}
            aria-controls="account-nav"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Menu size={18} /> Menu
          </button>
        </div>
        <nav
          id="account-nav"
          aria-label="Dashboard navigation"
          className={open ? s.navOpen : s.nav}
        >
          <p className={s.kicker}>Dashboard</p>
          <Selector rows={rows} active={active} />
          {links
            .filter(
              (l) =>
                l.url !== '/dashboard/settings/routing' ||
                rows.some((w) => w.id === active && w.role !== 'MEMBER'),
            )
            .filter(
              (l) =>
                l.url !== '/dashboard/lead-forms' ||
                rows.some((w) => w.id === active && w.role !== 'MEMBER'),
            )
            .filter(
              (l) =>
                rows.length ||
                !['/dashboard/team', '/dashboard/settings/workspace'].includes(l.url),
            )
            .map(({ url, label, icon: Icon }) => (
              <Link
                key={url}
                href={url}
                aria-current={pathname === url ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          {signout}
        </nav>
      </aside>
      <div className={s.body}>
        <header className={s.bar}>
          <span>{links.find((l) => l.url === pathname)?.label}</span>
          <details key={pathname} className={s.menu}>
            <summary>
              <span className={s.initial}>{name.slice(0, 1)}</span>
              <span>{name}</span>
              <ChevronDown size={15} />
            </summary>
            <div>
              <Link href="/dashboard/settings/profile">Account settings</Link>
              <Link href="/">Growora homepage</Link>
              {signout}
            </div>
          </details>
        </header>
        {error && <p role="alert">{error}</p>}
        <main id="main" className={s.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
