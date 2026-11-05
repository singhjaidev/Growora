import { redirect } from 'next/navigation';
import { workspaceContext } from '@/server/workspace/context';
import { forms } from '@/server/leads/service';
import { leadPermissions } from '@/lib/lead-policy';
import { FormEditor } from '@/components/leads/forms';
import s from '@/components/dashboard/dashboard.module.css';
export default async function Page() {
  const { actor, active } = await workspaceContext();
  if (!active) redirect('/dashboard/workspace');
  if (!leadPermissions[active.role].forms) redirect('/dashboard/leads');
  const rows = await forms(actor.id, active.id);
  return (
    <>
      <p className={s.kicker}>{active.name}</p>
      <h1>Enquiry forms</h1>
      <p className={s.intro}>
        Publish a form and share its link with customers. Titles and privacy notices are public.
      </p>
      <FormEditor key={active.id} workspaceId={active.id} />
      {rows.map((form) => (
        <FormEditor key={form.id + ':' + form.version} workspaceId={active.id} form={form} />
      ))}
    </>
  );
}
