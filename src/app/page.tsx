import { MarketingShell } from '@/components/marketing/shell';
import { Hero } from '@/components/marketing/hero';
import { HomepageSections } from '@/components/marketing/homepage';
import styles from '@/components/marketing/homepage.module.css';
export const metadata = { alternates: { canonical: '/' } };
export default function Home() {
  return (
    <MarketingShell>
      <div className={styles.home}>
        <Hero />
        <HomepageSections />
      </div>
    </MarketingShell>
  );
}
