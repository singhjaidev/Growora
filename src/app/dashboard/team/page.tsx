import { redirect } from 'next/navigation';
import Link from 'next/link';
import { workspaceContext } from '@/server/workspace/context';
import { team } from '@/server/workspace/access';
import { TeamPanel } from '@/components/workspace/forms';
import s from '@/components/dashboard/dashboard.module.css';
export default async function Page() {
  const { actor, active } = await workspaceContext();
  if (!active) redirect('/dashboard/workspace');
  const data = await team(actor.id, active.id);
  return (
    <>
      <p className={s.kicker}>{data.name}</p>
      <h1>Team</h1>
      <TeamPanel key={data.id} data={data} userId={actor.id} />
      {active.role !== 'MEMBER' && (
        <section className={s.panel}>
          <h2>Team routing</h2>
          <p>
            Manage specialties, availability and automatic assignment capacity for this workspace.
          </p>
          <Link href="/dashboard/settings/routing#members">Manage team routing profiles</Link>
        </section>
      )}
    </>
  );
}
