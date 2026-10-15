'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  FileInput,
  GitBranch,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  Plug,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Dialog, Logo } from '@/components/ui';
import { useLeads, useLocalState } from '@/components/providers';
export const appLinks = [
  { name: 'Overview', url: '/app', icon: LayoutDashboard },
  { name: 'Leads', url: '/app/leads', icon: Users },
  { name: 'Pipeline', url: '/app/pipeline', icon: ChartNoAxesCombined },
  { name: 'Automations', url: '/app/automations', icon: GitBranch },
  { name: 'Forms', url: '/app/forms', icon: FileInput },
  { name: 'Analytics', url: '/app/analytics', icon: ChartNoAxesCombined },
  { name: 'Integrations', url: '/app/integrations', icon: Plug },
  { name: 'Settings', url: '/app/settings', icon: Settings },
];
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { leads, notice, ready } = useLeads();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [workspace, setWorkspace] = useState(false);
  const [seen, setSeen] = useState(false);
  const [prefs] = useLocalState('growora-workspace', {
    name: 'Growora workspace',
    timezone: 'Europe/London',
    compact: false,
    notifications: true,
    threshold: 75,
  });
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  const title = appLinks.find((l) => l.url === pathname)?.name ?? 'Workspace';
  return (
    <div className={`app-shell ${prefs.compact ? 'compact-mode' : ''}`}>
      <aside className={`app-sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Logo />
          <button
            onClick={() => setOpen(false)}
            className="icon-button sidebar-close"
            aria-label="Close navigation"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
        <button className="workspace-switch" onClick={() => setWorkspace(true)}>
          <span className="workspace-letter">G</span>
          <span>
            {prefs.name}
            <small>workspace</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <p className="sidebar-label">WORKSPACE</p>
        <nav aria-label="Workspace navigation">
          {appLinks.map((item) => (
            <Link
              href={item.url}
              key={item.name}
              aria-current={pathname === item.url ? 'page' : undefined}
              className={pathname === item.url ? 'active' : ''}
            >
              <item.icon size={17} />
              {item.name}
              {item.name === 'Leads' && <span className="nav-count">{ready ? leads.length : '—'}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-workspace-note">
            <span className="live-dot" /> MADE TO BE EXPLORED
            <p>
              Your leads. Your next steps.
              <br />
              Your changes stay in this browser.
            </p>
            <Link href="/docs">
              Take a quick tour <ArrowUpRight size={13} />
            </Link>
          </div>
          <Link href="/" className="back-website">
            <ArrowUpRight size={15} /> Back to website
          </Link>
          <button className="profile" onClick={() => router.push('/app/settings')}>
            <span className="avatar">JD</span>
            <span>
              Jamie Lee<small>Workspace admin · Local</small>
            </span>
            <Settings size={15} />
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}
      <div className="app-main">
        <header className="app-topbar">
          <div>
            <button
              className="icon-button app-menu"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label="Open workspace navigation"
            >
              <Menu size={18} />
            </button>
            <span className="topbar-workspace">
              Workspace <span>/</span>
            </span>
            <strong>{title}</strong>
          </div>
          <div>
            <button className="app-search-trigger" aria-label="Search workspace" onClick={() => setSearchOpen(true)}>
              <Search size={15} />
              <span>Search anything…</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="demo-pill">WORKSPACE</span>
            <button
              className="icon-button notification-button"
              aria-label="Open notifications"
              onClick={() => {
                setNotifications(true);
                setSeen(true);
              }}
            >
              <Bell size={17} />
              {!seen && prefs.notifications && <i />}
            </button>
            <Link href="/docs" aria-label="Open documentation" className="icon-button help-button">
              <CircleHelp size={17} />
            </Link>
          </div>
        </header>
        {notice && (
          <div className="storage-notice" role="status">
            {notice}
          </div>
        )}
        <main id="main" className="app-content">
          {ready ? children : <div className="workspace-loading" role="status">Loading your workspace…<div /><div /><div /></div>}
        </main>
        <div className="app-footer">
          <span>
            <i className="live-dot" /> workspace · Local data
          </span>
          <Link href="/docs">
            Documentation <BookOpen size={12} />
          </Link>
        </div>
      </div>
      <Dialog
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setQuery('');
        }}
        title="Find your next step"
      >
        <label className="search-field command-search">
          <span className="sr-only">Search workspace</span>
          <Search />
          <input
            autoFocus
            placeholder="Search leads, companies or pages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="command-results">
          {appLinks
            .filter((l) => l.name.toLowerCase().includes(query.toLowerCase()))
            .map((l) => (
              <Link onClick={() => setSearchOpen(false)} href={l.url} key={l.url}>
                <l.icon size={16} />
                {l.name}
                <ArrowUpRight size={13} />
              </Link>
            ))}
          {query &&
            leads
              .filter((l) => `${l.name} ${l.company}`.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 6)
              .map((l) => (
                <Link
                  onClick={() => setSearchOpen(false)}
                  href={`/app/leads?highlight=${l.id}`}
                  key={l.id}
                >
                  <Users size={16} />
                  {l.name}
                  <small>{l.company}</small>
                </Link>
              ))}
          {query &&
            !appLinks.some((l) => l.name.toLowerCase().includes(query.toLowerCase())) &&
            !leads.some((l) =>
              `${l.name} ${l.company}`.toLowerCase().includes(query.toLowerCase()),
            ) && <p className="command-empty">No matches. Try a name, company or page.</p>}
        </div>
      </Dialog>
      <Dialog
        open={notifications}
        onClose={() => setNotifications(false)}
        title="Your activity feed"
      >
        <p className="micro">RECENT WORKSPACE ACTIVITY · WORKSPACE ACTIVITY</p>
        <div className="notification-list">
          {leads.slice(0, 4).map((l) => (
            <Link
              href={`/app/leads?highlight=${l.id}`}
              key={l.id}
              onClick={() => setNotifications(false)}
            >
              <span className="avatar">{l.name[0]}</span>
              <span>
                <strong>{l.name}</strong>
                <small>{l.activity.at(-1)}</small>
              </span>
              <ArrowUpRight size={14} />
            </Link>
          ))}
        </div>
      </Dialog>
      <Dialog open={workspace} onClose={() => setWorkspace(false)} title="Your workspace">
        <p>
          Your workspace is stored on this device. Explore the sample data, customize its name,
          and shape the process in Settings.
        </p>
        <div className="workspace-option">
          <span className="workspace-letter">G</span>
          <div>
            <strong>{prefs.name}</strong>
            <p>Local workspace · Admin access</p>
          </div>
          <span className="status">Active</span>
        </div>
        <div className="dialog-actions">
          <button
            className="button small"
            onClick={() => {
              setWorkspace(false);
              router.push('/app/settings');
            }}
          >
            Workspace settings <ArrowUpRight size={14} />
          </button>
        </div>
      </Dialog>
    </div>
  );
}
export function AppHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="app-page-heading">
      <div>
        <p className="micro">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
