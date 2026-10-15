import { MarketingShell } from '@/components/marketing/shell';
import { PremiumHomepage } from '@/components/marketing/premium-homepage';
export const metadata = {
  title: 'Growora — Turn more enquiries into paying customers',
  description:
    'Explore a connected lead workspace. Capture enquiries, prioritise opportunities and plan follow-ups with Growora’s interactive product workspace.',
  alternates: { canonical: '/' },
};
export default function Home() {
  return (
    <MarketingShell>
      <PremiumHomepage />
    </MarketingShell>
  );
}
