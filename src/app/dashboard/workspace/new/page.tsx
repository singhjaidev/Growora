import { requireProfile } from '@/server/account/profile';
import { BusinessForm } from '@/components/workspace/forms';
export default async function Page() {
  await requireProfile();
  return (
    <>
      <h1>New business workspace</h1>
      <BusinessForm />
    </>
  );
}
