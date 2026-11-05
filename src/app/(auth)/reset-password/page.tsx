import { AccountForm } from '@/components/auth/account-form';
export const metadata = { title: 'Reset password', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function Page() { return <AccountForm mode="reset" />; }
