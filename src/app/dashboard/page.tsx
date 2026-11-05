import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { workspaceContext } from '@/server/workspace/context';
import { LeadSummary } from '@/components/leads/summary';
import { requireProfile } from '@/server/account/profile';
import s from '@/components/dashboard/dashboard.module.css';
export default async function Overview() {
  const p = await requireProfile();
  const { active } = await workspaceContext();
  return (
    <>
      <p className={s.kicker}>Account overview</p>
      <h1>Welcome, {p.name}.</h1>
      <p className={s.intro}>Your Growora account at a glance.</p>
      <section className={s.panel}>
        <h2>Your account</h2>
        <dl className={s.facts}>
          <div>
            <dt>Display name</dt>
            <dd>{p.name}</dd>
          </div>
          <div>
            <dt>Registered email</dt>
            <dd>{p.email}</dd>
          </div>
          <div>
            <dt>Email verification</dt>
            <dd>{p.emailVerified ? 'Verified' : 'Optional · unverified'}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>
              {new Date(p.createdAt).toLocaleDateString('en-GB', {
                dateStyle: 'long',
                timeZone: 'UTC',
              })}
            </dd>
          </div>
        </dl>
        <div className={s.links}>
          <Link href="/dashboard/settings/profile">
            Edit account settings <ArrowUpRight size={16} />
          </Link>
          <Link href="/dashboard/settings/security">
            Manage security <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <section className={s.panel}>
        <h2>Business workspace</h2>
        <p>Create or open your workspace to manage business details and team access.</p>
        <Link href="/dashboard/workspace">Open workspace overview</Link>
      </section>
      {active && <LeadSummary userId={p.id} workspaceId={active.id} name={active.name} />}
    </>
  );
}
