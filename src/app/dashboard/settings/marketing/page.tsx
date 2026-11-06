import { requireProfile } from '@/server/account/profile';
import { DestinationSettings } from '@/components/marketing/destination-settings';
import { siteOwner } from '@/server/marketing/destination';
import s from '@/components/dashboard/dashboard.module.css';
export default async function Page() {
  const profile = await requireProfile();
  return (
    <>
      <p className={s.kicker}>Website settings</p>
      <h1>Marketing Website Enquiries</h1>
      {!siteOwner(profile.id) && (
        <p>
          Your account ID: <code>{profile.id}</code>. The site operator must authorize this ID in
          MARKETING_WEBSITE_OWNER_IDS before you can manage the main website destination.
        </p>
      )}
      <DestinationSettings />
    </>
  );
}
