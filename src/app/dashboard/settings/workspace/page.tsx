import { redirect } from 'next/navigation';
import Link from 'next/link';
import { workspaceContext } from '@/server/workspace/context';
import { details } from '@/server/workspace/access';
import { BusinessForm } from '@/components/workspace/forms';
import s from '@/components/dashboard/dashboard.module.css';
export default async function Page() {
  const { actor, active } = await workspaceContext();
  if (!active) redirect('/dashboard/workspace');
  const w = await details(actor.id, active.id);
  return (
    <>
      <p className={s.kicker}>{w.name}</p>
      <h1>Workspace settings</h1>
      {w.role === 'OWNER' ? (
        <BusinessForm key={w.id} business={w} />
      ) : (
        <section className={s.panel}>
          <h2>Business profile</h2>
          <p>Only the workspace owner can change these details.</p>
          <Link href="/dashboard/workspace">View business information</Link>
        </section>
      )}
    </>
  );
}
