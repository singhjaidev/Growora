import { redirect } from 'next/navigation';
import { getProfile } from '@/server/account/profile';
import { AccountForm } from '@/components/auth/account-form';
export const metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default async function Page() {
  if (await getProfile()) redirect('/dashboard');
  return <AccountForm mode="login" />;
}
