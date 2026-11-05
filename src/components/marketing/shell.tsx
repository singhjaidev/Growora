'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { Logo, Mark } from '@/components/ui';
import { Closing } from './premium-homepage';
import homeStyles from './premium-homepage.module.css';

export { Closing as FinalCTA };
export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Product', href: '/product' },
    { label: 'Solutions', href: '/solutions' },
    { label: 'Integrations', href: '/integrations' },
    { label: 'Pricing', href: '/pricing' },
  ];

  return (
    <header className={`site-header ${homeStyles.header} ${scrolled ? homeStyles.headerScrolled : ''}`}>
      <div className="container nav-inner">
        <Logo />
        <nav aria-label="Main navigation" className={homeStyles.simpleNav}>
          <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
            Home
          </Link>
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/how-it-works"
            className={homeStyles.navCta}
            aria-current={pathname === '/how-it-works' ? 'page' : undefined}
          >
            See how it works <ArrowUpRight size={15} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
export function Footer() {
  const pathname = usePathname();

  const navLinks = [
    { label: 'Product', href: '/product' },
    { label: 'Solutions', href: '/solutions' },
    { label: 'Integrations', href: '/integrations' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'See how it works', href: '/how-it-works' },
  ];

  return (
    <footer className={`footer ${homeStyles.footer}`}>
      <div className={homeStyles.container}>
        <div className="footer-top">
          <div>
            <Logo />
            <p>Capture the interest. Keep the context. Turn conversations into opportunities.</p>
            <span className="micro">One connected lead workspace.</span>
          </div>
          <div>
            <p className="kicker">Platform</p>
            {navLinks.slice(0, 3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div>
            <p className="kicker">Explore</p>
            <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
              Home
            </Link>
            <Link href="/pricing" aria-current={pathname === '/pricing' ? 'page' : undefined}>
              Pricing
            </Link>
            <Link
              href="/how-it-works"
              aria-current={pathname === '/how-it-works' ? 'page' : undefined}
            >
              See how it works
            </Link>
          </div>
          <div>
            <p className="kicker">Made for your next step</p>
            <p>For service businesses, agencies and teams built on customer conversations.</p>
          </div>
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
      </div>
    </footer>
  );
}
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={homeStyles.marketingShell}>
      <Header />
      <main id="main" className="marketing-main">
        {children}
      </main>
      <div className={homeStyles.home}>
        <Closing />
      </div>
      <Footer />
    </div>
  );
}
