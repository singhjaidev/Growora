import Link from 'next/link';
import { workspaceContext } from '@/server/workspace/context';
import { details } from '@/server/workspace/access';
import { BusinessForm } from '@/components/workspace/forms';
import s from '@/components/dashboard/dashboard.module.css';
export default async function Page() {
  const { actor, active } = await workspaceContext();
  if (!active)
    return (
      <>
        <p className={s.kicker}>Business workspace</p>
        <h1>Your first workspace</h1>
        <BusinessForm />
        <p>Already invited? Open the invitation in your email to join your team.</p>
      </>
    );
  const w = await details(actor.id, active.id);
  const missing = (['description', 'industry', 'website', 'location'] as const).filter(
    (k) => !w[k],
  );
  return (
    <>
      <p className={s.kicker}>Workspace overview</p>
      <h1>{w.name}</h1>
      <p className={s.intro}>{w.description || 'Your private business workspace.'}</p>
      <section className={s.panel}>
        <h2>Workspace information</h2>
        <dl className={s.facts}>
          {Object.entries({
            'Your role': w.role,
            Members: w.members,
            ...(w.invitations === null ? {} : { 'Pending invitations': w.invitations }),
            Industry: w.industry || 'Not set',
            Website: w.website || 'Not set',
            Location: w.location || 'Not set',
          }).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p>
          {missing.length
            ? 'Optional details to add: ' + missing.join(', ') + '.'
            : 'Business profile complete.'}
        </p>
        <div className={s.links}>
          <Link href="/dashboard/team">View team</Link>
          <Link href="/dashboard/settings/workspace">Workspace settings</Link>
        </div>
      </section>
      <Link href="/dashboard/workspace/new">Create another workspace</Link>
    </>
  );
}
