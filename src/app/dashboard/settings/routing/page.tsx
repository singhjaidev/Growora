import Link from 'next/link';
import { redirect } from 'next/navigation';
import { workspaceContext } from '@/server/workspace/context';
import { settings, history } from '@/server/routing/service';
import { list } from '@/server/leads/service';
import {
  PolicyForm,
  MemberProfile,
  RoutingPreview,
  DecisionList,
} from '@/components/routing/forms';
import s from '@/components/dashboard/dashboard.module.css';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ members?: string; history?: string }>;
}) {
  const { actor, active } = await workspaceContext();
  if (!active) redirect('/dashboard/workspace');
  if (active.role === 'MEMBER') redirect('/dashboard/leads');
  const q = await searchParams,
    data = await settings(actor.id, active.id, Number(q.members ?? 1)),
    past = await history(actor.id, active.id, undefined, Number(q.history ?? 1)),
    leads = await list(actor.id, active.id, new URLSearchParams());
  return (
    <>
      <p className={s.kicker}>{active.name}</p>
      <h1>Routing settings</h1>
      <p className={s.intro}>
        Assign enquiries within this workspace using explicit rules and real team capacity.
      </p>
      <PolicyForm key={data.policy.version} workspaceId={active.id} data={data} />
      <section className={s.panel}>
        <h2>Routing activity</h2>
        {data.metrics.map((m) => (
          <p key={m.outcome}>
            {m.outcome}: {m.count} · average processing {m.latency} ms
          </p>
        ))}
        {!data.metrics.length && <p>No decisions recorded.</p>}
        {data.jobs.map((j) => (
          <p key={j.status}>
            {j.status}: {j.count} tasks · {j.attempts} attempts · {j.retries} retries
          </p>
        ))}
        {data.strategies.map((v) => (
          <p key={v.strategy}>
            {v.strategy}: {v.count} decisions
          </p>
        ))}
        <Link href="/dashboard/leads?routing=REVIEW">View leads awaiting routing review</Link>
      </section>
      <div id="members">
        <h2>Team routing profiles</h2>
        <p>
          Profiles default to ineligible and unavailable. Capacity limits apply to automatic
          assignments; manual assignment stays under human control.
        </p>
        {data.members.map((m) => (
          <MemberProfile key={m.id + ':' + m.version} workspaceId={active.id} member={m} />
        ))}
        <div className={s.actions}>
          {data.memberPage > 1 && (
            <Link href={'?members=' + (data.memberPage - 1)}>Previous members</Link>
          )}
          <span>
            Page {data.memberPage} of {data.memberPages}
          </span>
          {data.memberPage < data.memberPages && (
            <Link href={'?members=' + (data.memberPage + 1)}>Next members</Link>
          )}
        </div>
      </div>
      <RoutingPreview workspaceId={active.id} leads={leads.rows} />
      <section className={s.panel}>
        <h2>Recent routing decisions</h2>
        <DecisionList rows={past.rows} />
        <div className={s.actions}>
          {past.historyPage > 1 && (
            <Link href={'?history=' + (past.historyPage - 1)}>Previous decisions</Link>
          )}
          <span>
            Page {past.historyPage} of {past.pages}
          </span>
          {past.historyPage < past.pages && (
            <Link href={'?history=' + (past.historyPage + 1)}>Next decisions</Link>
          )}
        </div>
      </section>
    </>
  );
}
