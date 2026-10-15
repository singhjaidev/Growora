import { MarketingShell } from '@/components/marketing/shell';
import { Homepage } from '@/components/marketing/homepage';
export const metadata = { alternates: { canonical: '/' } };
export default function Home() {
  return (
    <MarketingShell>
      <Homepage />
    </MarketingShell>
  );
}
