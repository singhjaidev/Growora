import Link from 'next/link';
import { redirect } from 'next/navigation';
import { workspaceContext } from '@/server/workspace/context';
import { WorkspaceError } from '@/server/workspace/access';
import { list } from '@/server/leads/service';
import { leadStatuses } from '@/lib/lead-policy';
import { priorities } from '@/server/intelligence/contract';
import s from '@/components/dashboard/dashboard.module.css';
import l from '@/components/leads/leads.module.css';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor, active } = await workspaceContext();
  if (!active) redirect('/dashboard/workspace');
  const raw = await searchParams,
    query = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) if (typeof v === 'string') query.set(k, v);
  let data: Awaited<ReturnType<typeof list>>;
  try {
    data = await list(actor.id, active.id, query);
  } catch (e) {
    if (e instanceof WorkspaceError)
      return (
        <section className={s.panel}>
          <h1>Unable to show leads</h1>
          <p>{e.message}</p>
          <Link href="/dashboard/leads">Reset filters</Link>
        </section>
      );
    throw e;
  }
  const pageUrl = (page: number) => {
    const q = new URLSearchParams(query);
    q.set('page', String(page));
    return '/dashboard/leads?' + q;
  };
  return (
    <>
      <p className={s.kicker}>{active.name}</p>
      <h1>Leads</h1>
      <p className={s.intro}>
        {data.canManage ? 'Manage your workspace enquiries.' : 'Enquiries assigned to you.'}
      </p>
      <section className={s.panel}>
        <form className={l.filters} action="/dashboard/leads">
          <label>
            Search
            <input
              name="q"
              defaultValue={query.get('q') ?? ''}
              maxLength={120}
              placeholder="Name, email or subject"
            />
          </label>
          <label>
            Status
            <select name="status" defaultValue={query.get('status') ?? ''}>
              <option value="">All statuses</option>
              {leadStatuses.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Date order
            <select name="sort" defaultValue={query.get('sort') ?? 'newest'}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="priority">Highest priority score</option>
            </select>
          </label>
          {data.canManage && (
            <label>
              Assignment
              <select name="assigned" defaultValue={query.get('assigned') ?? ''}>
                <option value="">All assignments</option>
                <option value="unassigned">Unassigned</option>
                {data.assignees.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Retention
            <select name="review" defaultValue={query.get('review') ?? ''}>
              <option value="">All enquiries</option>
              <option value="due">Review due</option>
            </select>
          </label>
          <button className={s.primary}>Apply filters</button>
          <label>
            Routing state
            <select name="routing" defaultValue={query.get('routing') ?? ''}>
              <option value="">All routing states</option>
              {['REVIEW', 'FAILED', 'PENDING', 'ASSIGNED', 'MANUAL'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            AI priority
            <select name="priority" defaultValue={query.get('priority') ?? ''}>
              <option value="">All priorities</option>
              {priorities.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <Link href="/dashboard/leads">Clear filters</Link>
        </form>
      </section>
      <section className={s.panel}>
        <h2>
          {data.total} {data.total === 1 ? 'enquiry' : 'enquiries'}
        </h2>
        {data.rows.length ? (
          <div className={l.tableWrap}>
            <table className={l.table}>
              <thead>
                <tr>
                  {['Customer', 'Subject', 'Status', 'Assigned to', 'Received', 'AI priority'].map(
                    (c) => (
                      <th scope="col" key={c}>
                        {c}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link href={'/dashboard/leads/' + row.id}>{row.customerName}</Link>
                    </td>
                    <td>{row.subject}</td>
                    <td>
                      <span className={l.badge}>{row.status}</span>
                    </td>
                    <td>
                      {row.assignedName ?? 'Unassigned'}
                      <small>
                        {row.assignmentOrigin} · {row.routingState}
                      </small>
                    </td>
                    <td>
                      {new Date(row.createdAt).toLocaleDateString('en-GB', { timeZone: 'UTC' })}
                    </td>
                    <td>
                      {row.priority
                        ? `${row.priority} · ${row.priorityScore}/100`
                        : (row.aiStatus ?? 'Not analyzed')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            {query.size
              ? 'No enquiries match these filters.'
              : data.canManage
                ? 'No enquiries yet. Create a form and share its link to receive your first customer request.'
                : 'No enquiries have been assigned to you yet.'}
          </p>
        )}
        <nav aria-label="Lead pages" className={l.pages}>
          {data.page > 1 ? <Link href={pageUrl(data.page - 1)}>Previous</Link> : <span />}
          <span>
            Page {data.page} of {data.pages}
          </span>
          {data.page < data.pages ? <Link href={pageUrl(data.page + 1)}>Next</Link> : <span />}
        </nav>
        {data.canManage && (
          <div className={s.links}>
            <Link href="/dashboard/lead-forms">Manage enquiry forms</Link>
          </div>
        )}
      </section>
    </>
  );
}
