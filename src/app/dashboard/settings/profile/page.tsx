import { requireProfile } from '@/server/account/profile';
import { ProfileForm } from '@/components/dashboard/forms';
import s from '@/components/dashboard/dashboard.module.css';
export default async function Profile() {
  const { name, email } = await requireProfile();
  return (
    <>
      <p className={s.kicker}>Account settings</p>
      <h1>Profile</h1>
      <p className={s.intro}>Manage how your name appears in Growora.</p>
      <ProfileForm name={name} email={email} />
    </>
  );
}
