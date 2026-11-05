import { AccountForm } from '@/components/auth/account-form';
export const metadata = { title: 'Forgot password', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default function Page() {
  return <AccountForm mode="forgot" localInbox={process.env.NODE_ENV === 'development' && process.env.GROWORA_LOCAL_INBOX === '1'} />;
}
