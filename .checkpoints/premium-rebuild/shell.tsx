'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { Logo, ButtonLink, Mark, Dialog } from '@/components/ui';
import { useLeads } from '@/components/providers';
import homeStyles from './homepage.module.css';
const links = [
  ['Product', '/product'],
  ['Solutions', '/solutions'],
  ['Integrations', '/integrations'],
  ['Pricing', '/pricing'],
];
export function Header() {
  const pathname = usePathname();
  const NavigationLink = pathname === '/' ? 'a' : Link;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [login, setLogin] = useState(false);
  const homeTargets: Record<string, string> = {
    Product: '#platform',
    Solutions: '#solutions',
    Integrations: '#connections',
    Pricing: '#pricing',
  };
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  return (
    <>
      <header
        className={`site-header ${pathname === '/' ? homeStyles.header : ''} ${scrolled ? 'scrolled' : ''}`}
      >
        <div className="container nav-inner">
          <Logo />
          <nav
            aria-label="Main navigation"
            className={open ? 'nav-links open' : 'nav-links'}
            id="main-navigation"
          >
            {links.map(([label, href]) => (
              <NavigationLink
                key={href}
                href={pathname === '/' ? homeTargets[label] : href}
                onClick={() => setOpen(false)}
                aria-current={pathname === href ? 'page' : undefined}
              >
                {label}
              </NavigationLink>
            ))}
            <button
              className="mobile-signin"
              onClick={() => {
                setOpen(false);
                setLogin(true);
              }}
            >
              Log in <ArrowUpRight size={16} />
            </button>
          </nav>
          <div className="nav-actions">
            <button className="signin" onClick={() => setLogin(true)}>
              Log in <ArrowUpRight size={14} />
            </button>
            <ButtonLink href="/contact">Get started</ButtonLink>
            <button
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="main-navigation"
              className="menu-button icon-button"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <Dialog open={login} onClose={() => setLogin(false)} title="Log in to Growora">
        <p className={homeStyles.loginNote}>
          Secure account access is being prepared. Contact us to discuss setting up your workspace.
        </p>
        <ButtonLink href="/contact">Contact the team</ButtonLink>
      </Dialog>
    </>
  );
}
export function Footer() {
  const pathname = usePathname();
  return (
    <footer className={`footer container ${pathname === '/' ? homeStyles.footer : ''}`}>
      <div className="footer-top">
        <div>
          <Logo />
          <p>
            A clear path from
            <br />
            interest to opportunity.
          </p>
          <span className="micro">Better leads. Bigger opportunities.</span>
        </div>
        {[
          [
            'Product',
            ['Platform', '/product'],
            ['Automations', '/product#automation'],
            ['Lead management', '/app/leads'],
            ['Analytics', '/app/analytics'],
          ],
          [
            'Explore',
            ['Solutions', '/solutions'],
            ['Integrations', '/integrations'],
            ['Pricing', '/pricing'],
            ['Get started', '/contact'],
          ],
          [
            'Resources',
            ['Our approach', '/about'],
            ['Documentation', '/docs'],
            ['Guides', '/guides'],
            ['Contact', '/contact'],
          ],
          ['Legal', ['Privacy', '/privacy'], ['Terms', '/terms']],
        ].map(([title, ...items]) => (
          <div key={String(title)}>
            <p className="kicker">{title as string}</p>
            {(items as string[][]).map(([label, url]) => (
              <Link href={url} key={url}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Growora. Built with intent.</span>
        <span>
          <i className="live-dot" /> Every lead deserves a next step.
        </span>
        <a href="#main" aria-label="Back to top">
          <Mark />
        </a>
      </div>
    </footer>
  );
}
export function FinalCTA() {
  const { leads, activeLeadId } = useLeads();
  const lead = leads.find((record) => record.id === activeLeadId);
  return (
    <section className="final-cta container">
      <div className="cta-line" />
      <p className="kicker">LESS FRICTION. MORE FORWARD.</p>
      <h2>
        Your next opportunity.
        <br />
        <span>Give it somewhere to go.</span>
      </h2>
      {lead && (
        <p className="cta-record">
          {lead.name} · {lead.status} · {lead.owner}
        </p>
      )}
      <ButtonLink href={lead ? `/app/leads?highlight=${lead.id}` : '/app'}>
        {lead ? 'Continue with your opportunity' : 'Explore your workspace'}
      </ButtonLink>
      <p className="micro">Explore the product. No account needed.</p>
    </section>
  );
}
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="marketing-main">
        {children}
      </main>
      <Footer />
    </>
  );
}
