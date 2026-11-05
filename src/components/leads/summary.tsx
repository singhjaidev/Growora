import Link from 'next/link';
import { overview } from '@/server/leads/service';
import s from '@/components/dashboard/dashboard.module.css';
export async function LeadSummary({
  userId,
  workspaceId,
  name,
}: {
  userId: string;
  workspaceId: string;
  name: string;
}) {
  const data = await overview(userId, workspaceId);
  return (
    <section className={s.panel}>
      <h2>Enquiries · {name}</h2>
      <p>{data.canManage ? 'Workspace enquiries' : 'Enquiries assigned to you'}</p>
      <dl className={s.facts}>
        {Object.entries({ Total: data.total, ...data.counts }).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {data.recent.length ? (
        <>
          <h3>Recently received</h3>
          <ul>
            {data.recent.map((row) => (
              <li key={row.id}>
                <Link href={'/dashboard/leads/' + row.id}>
                  {row.customerName} · {row.subject}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>
          {data.canManage
            ? 'No enquiries yet. Create and share a public enquiry form to start receiving requests.'
            : 'No enquiries have been assigned to you yet.'}
        </p>
      )}
      <div className={s.links}>
        <Link href="/dashboard/leads">View leads</Link>
        {data.canManage && <Link href="/dashboard/lead-forms">Manage enquiry forms</Link>}
      </div>
    </section>
  );
}
