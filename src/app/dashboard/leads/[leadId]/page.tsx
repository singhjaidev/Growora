import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { workspaceContext } from '@/server/workspace/context';
import { WorkspaceError } from '@/server/workspace/access';
import { detail } from '@/server/leads/service';
import { LeadControls } from '@/components/leads/forms';
import { AIInsights } from '@/components/leads/insights';
import { insights } from '@/server/intelligence/service';
import { history } from '@/server/routing/service';
import { RoutingLead, RoutingPreview } from '@/components/routing/forms';
import s from '@/components/dashboard/dashboard.module.css';
import l from '@/components/leads/leads.module.css';
const date = (v: Date) => new Date(v).toLocaleString('en-GB', { timeZone: 'UTC' }) + ' UTC';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ leadId: string }>;
  searchParams: Promise<{ activityPage?: string; routingPage?: string }>;
}) {
  const { actor, active } = await workspaceContext();
  if (!active) redirect('/dashboard/workspace');
  const { leadId } = await params,
    { activityPage, routingPage } = await searchParams;
  let data: Awaited<ReturnType<typeof detail>>;
  try {
    data = await detail(actor.id, active.id, leadId, Number(activityPage ?? 1));
  } catch (e) {
    if (e instanceof WorkspaceError && [400, 403, 404].includes(e.status)) notFound();
    throw e;
  }
  const row = data.lead;
  return (
    <>
      <Link href="/dashboard/leads">← All leads</Link>
      <p className={s.kicker}>{active.name}</p>
      <h1>{row.subject}</h1>
      <p className={s.intro}>Received {date(row.createdAt)}</p>
      <section className={s.panel}>
        <h2>{row.customerName}</h2>
        <dl className={s.facts}>
          <div>
            <dt>Email</dt>
            <dd>{row.customerEmail}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{row.customerPhone || 'Not provided'}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{row.status}</dd>
          </div>
          <div>
            <dt>Assigned to</dt>
            <dd>{row.assignedName ?? 'Unassigned'}</dd>
          </div>
          <div>
            <dt>Source form</dt>
            <dd>{row.source}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{date(row.updatedAt)}</dd>
          </div>
        </dl>
        <h3>Message</h3>
        <p className={l.message}>{row.message}</p>
        <details>
          <summary>Privacy acknowledgement</summary>
          <p className={l.message}>{row.consentNotice}</p>
        </details>
      </section>
      <LeadControls workspaceId={active.id} data={data} />
      <RoutingLead
        workspaceId={active.id}
        leadId={leadId}
        version={row.version}
        state={row.routingState}
        origin={row.assignmentOrigin}
        assigned={!!row.assignedToUserId}
        closed={row.status === 'CLOSED'}
        canManage={data.canManage}
        data={await history(actor.id, active.id, leadId, Number(routingPage ?? 1))}
      />
      {data.canManage && <RoutingPreview workspaceId={active.id} leadId={leadId} />}
      <AIInsights
        workspaceId={active.id}
        leadId={leadId}
        data={await insights(actor.id, active.id, leadId)}
      />
      <section className={s.panel}>
        <h2>Activity history</h2>
        <ol className={l.activity}>
          {data.activity.map((a) => (
            <li key={a.id}>
              {a.action === 'AUTO_ASSIGNED'
                ? `Automatically assigned to ${a.afterName ?? 'former member'}`
                : a.action === 'RECEIVED'
                  ? 'Enquiry received'
                  : a.action === 'STATUS_CHANGED'
                    ? `Status changed: ${a.before} → ${a.after}`
                    : a.action === 'MEMBER_REMOVED'
                      ? 'Assignment cleared after member removal'
                      : `Assignment changed: ${a.beforeName ?? 'Unassigned'} → ${a.afterName ?? 'Unassigned'}`}
              <small>
                {date(a.createdAt)} ·{' '}
                {a.actor ?? (a.action === 'RECEIVED' ? 'Public submission' : a.action === 'AUTO_ASSIGNED' ? 'Routing worker' : 'Former team member')}
              </small>
            </li>
          ))}
        </ol>
        <nav aria-label="Activity pages" className={l.pages}>
          {data.activityPage > 1 ? (
            <Link href={'?activityPage=' + (data.activityPage - 1)}>Previous</Link>
          ) : (
            <span />
          )}
          <span>
            Page {data.activityPage} of {data.activityPages}
          </span>
          {data.activityPage < data.activityPages ? (
            <Link href={'?activityPage=' + (data.activityPage + 1)}>Next</Link>
          ) : (
            <span />
          )}
        </nav>
      </section>
    </>
  );
}
