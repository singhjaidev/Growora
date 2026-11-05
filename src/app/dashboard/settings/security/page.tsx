import { activeSessions } from '@/server/account/profile';
import { SecurityForms } from '@/components/dashboard/forms';
import s from '@/components/dashboard/dashboard.module.css';
export default async function Security() {
  const sessions = await activeSessions();
  return (
    <>
      <p className={s.kicker}>Account settings</p>
      <h1>Security</h1>
      <p className={s.intro}>Manage your password and access to your account.</p>
      <SecurityForms sessions={sessions} />
    </>
  );
}
