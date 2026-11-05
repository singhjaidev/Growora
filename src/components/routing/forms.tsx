'use client';
import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { settings, history, preview } from '@/server/routing/service';
import { strategies } from '@/server/routing/engine';
import s from '@/components/dashboard/dashboard.module.css';
import l from '@/components/leads/leads.module.css';
type Settings = Awaited<ReturnType<typeof settings>>;
function useSave(workspaceId: string) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function save(action: string, fields: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/routing/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, ...fields }),
      });
      if (r.status === 401) {
        router.replace('/login');
        return;
      }
      const b = await r.json();
      setMessage(r.ok ? 'Saved.' : (b.message ?? 'Unable to save.'));
      if (r.ok) router.refresh();
    } catch {
      setMessage('Unable to reach Growora. Please retry.');
    } finally {
      setBusy(false);
    }
  }
  return { save, busy, message };
}
export function PolicyForm({ workspaceId, data }: { workspaceId: string; data: Settings }) {
  const { save, busy, message } = useSave(workspaceId),
    p = data.policy,
    [rules, setRules] = useState(p.formSkills);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void save('policy', {
      version: p.version,
      enabled: f.get('enabled') === 'on',
      strategy: f.get('strategy'),
      fallback: f.get('fallback'),
      skillWeight: Number(f.get('skillWeight')),
      loadWeight: Number(f.get('loadWeight')),
      useReviewedAI: f.get('useReviewedAI') === 'on',
      formSkills: rules,
    });
  }
  return (
    <section className={s.panel}>
      <h2>Workspace routing policy</h2>
      <p>
        Policy version {p.version} ·{' '}
        {p.enabled && p.strategy !== 'MANUAL' ? 'Automatic routing enabled' : 'Manual routing'}
      </p>
      <p>
        New automation only handles newly submitted leads. Existing leads need an explicit routing
        request.
      </p>
      <form onSubmit={submit} className={l.fields}>
        <label className={l.check}>
          <input type="checkbox" name="enabled" defaultChecked={p.enabled} />
          Enable automatic routing
        </label>
        <label>
          Routing strategy
          <select name="strategy" defaultValue={p.strategy}>
            {strategies.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          When category or skill match is missing
          <select name="fallback" defaultValue={p.fallback}>
            <option value="REVIEW">Leave unassigned for review</option>
            <option value="LEAST_LOADED">Use least-loaded eligible member</option>
          </select>
        </label>
        <p>
          Round-robin and least-loaded do not need a category. Skill and hybrid routing use form
          specialties first. Availability and capacity are always required.
        </p>
        <div className={l.controls}>
          <label>
            Skill weight
            <input
              type="number"
              name="skillWeight"
              min={0}
              max={100}
              defaultValue={p.skillWeight}
            />
          </label>
          <label>
            Workload weight
            <input type="number" name="loadWeight" min={0} max={100} defaultValue={p.loadWeight} />
          </label>
        </div>
        <p>Hybrid weights must total 100. Workload counts NEW, CONTACTED and QUALIFIED leads.</p>
        <label className={l.check}>
          <input type="checkbox" name="useReviewedAI" defaultChecked={p.useReviewedAI} />
          Allow previously accepted AI categories when no form specialty is configured
        </label>
        <p>This does not enable AI or call an external provider.</p>
        <h3>Form specialties</h3>
        {rules.map((r, i) => (
          <div className={l.controls} key={i}>
            <label>
              Enquiry form {i + 1}
              <select
                value={r.formId}
                onChange={(e) =>
                  setRules(rules.map((v, n) => (n === i ? { ...v, formId: e.target.value } : v)))
                }
              >
                <option value="">Choose a form</option>
                {data.forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Specialty {i + 1}
              <input
                value={r.skill}
                maxLength={60}
                required
                onChange={(e) =>
                  setRules(rules.map((v, n) => (n === i ? { ...v, skill: e.target.value } : v)))
                }
              />
            </label>
            <button type="button" onClick={() => setRules(rules.filter((_, n) => n !== i))}>
              Remove rule {i + 1}
            </button>
          </div>
        ))}
        <div className={s.actions}>
          <button
            type="button"
            disabled={rules.length >= 20}
            onClick={() => setRules([...rules, { formId: '', skill: '' }])}
          >
            Add form specialty
          </button>
          <button className={s.primary} disabled={busy}>
            Save routing policy
          </button>
        </div>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
export function MemberProfile({
  workspaceId,
  member: m,
}: {
  workspaceId: string;
  member: Settings['members'][number];
}) {
  const { save, busy, message } = useSave(workspaceId);
  return (
    <section className={s.panel}>
      <h3>
        {m.name} · {m.role}
      </h3>
      <form
        className={l.fields}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void save('profile', {
            memberId: m.id,
            version: m.version ?? 0,
            eligible: f.get('eligible') === 'on',
            available: f.get('available') === 'on',
            capacity: Number(f.get('capacity')),
            skills: String(f.get('skills'))
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean),
          });
        }}
      >
        <label className={l.check}>
          <input
            name="eligible"
            type="checkbox"
            defaultChecked={m.eligible ?? false}
            disabled={!m.canEdit}
          />
          Eligible for automatic assignments
        </label>
        <label className={l.check}>
          <input
            name="available"
            type="checkbox"
            defaultChecked={m.available ?? false}
            disabled={!m.canEdit}
          />
          Available for new leads
        </label>
        <label>
          Active assignment capacity
          <input
            name="capacity"
            type="number"
            min={1}
            max={1000}
            defaultValue={m.capacity ?? 10}
            disabled={!m.canEdit}
          />
        </label>
        <label>
          Specialties (comma separated)
          <input
            name="skills"
            defaultValue={m.skills?.join(', ') ?? ''}
            maxLength={1200}
            disabled={!m.canEdit}
          />
        </label>
        {m.canEdit ? (
          <button disabled={busy}>Save routing profile</button>
        ) : (
          <p>An owner manages this member’s routing profile.</p>
        )}
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
export function RoutingPreview({
  workspaceId,
  leads,
  leadId,
}: {
  workspaceId: string;
  leads?: { id: string; customerName: string; subject: string }[];
  leadId?: string;
}) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof preview>> | null>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <section className={s.panel}>
      <h2>Test Routing Rules</h2>
      <p>Simulation only. No assignment, job, history entry or rotation state is changed.</p>
      <form
        className={l.fields}
        onSubmit={async (e) => {
          e.preventDefault();
          const id = leadId || String(new FormData(e.currentTarget).get('leadId'));
          setBusy(true);
          setMessage('');
          setResult(null);
          try {
            const r = await fetch(
              '/api/routing/preview?' + new URLSearchParams({ workspaceId, id }),
            );
            const b = await r.json();
            if (r.ok) setResult(b);
            else setMessage(b.message ?? 'Preview unavailable.');
          } catch {
            setMessage('Could not load preview.');
          } finally {
            setBusy(false);
          }
        }}
      >
        {!leadId && (
          <label>
            Recent enquiry
            <select name="leadId" required>
              <option value="">Choose an enquiry</option>
              {leads?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.customerName} · {v.subject}
                </option>
              ))}
            </select>
          </label>
        )}
        <button disabled={busy}>Preview routing</button>
      </form>
      {result && (
        <div role="status">
          <h3>Simulation: {result.decision.outcome}</h3>
          <p>
            {result.selectedName ?? 'No member selected'} · {result.decision.reason}
          </p>
          <p>
            Strategy {result.decision.strategy} · policy {result.decision.policyVersion} · category
            source {result.decision.source}
          </p>
          {result.decision.factors && (
            <p>
              Active workload {result.decision.factors.active}/{result.decision.factors.capacity} ·
              specialty match {result.decision.factors.skillMatch ? 'yes' : 'no'}
              {result.decision.strategy === 'HYBRID' && result.decision.reason === 'MATCHED' && (
                <> · weighted suitability {result.decision.factors.total}/100</>
              )}
            </p>
          )}
        </div>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
export function RoutingLead({
  workspaceId,
  leadId,
  version,
  state,
  origin,
  assigned,
  closed,
  canManage,
  data,
}: {
  workspaceId: string;
  leadId: string;
  version: number;
  state: string;
  origin: string;
  assigned: boolean;
  closed: boolean;
  canManage: boolean;
  data: Awaited<ReturnType<typeof history>>;
}) {
  const { save, busy, message } = useSave(workspaceId),
    router = useRouter();
  useEffect(() => {
    if (state !== 'PENDING') return;
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [state, router]);
  return (
    <section className={s.panel}>
      <h2>Routing history</h2>
      <p>
        Assignment source: {origin} · Routing state: {state}
      </p>
      {canManage && (
        <>
          <p>
            To replace an existing assignment, unassign it first, then deliberately request routing.
            Manual unassignment otherwise remains in place.
          </p>
          <div className={s.actions}>
            <button
              disabled={busy || assigned || closed || state === 'PENDING'}
              onClick={() => save('reroute', { id: leadId, version })}
            >
              Request routing
            </button>
            <button onClick={() => router.refresh()}>Refresh routing</button>
          </div>
          <p role="status">{message}</p>
        </>
      )}
      {data.jobs.map((j, i) => (
        <p key={i}>
          Task {j.status} · attempts {j.attempts}
          {j.errorCode ? ' · ' + j.errorCode : ''}
        </p>
      ))}
      <DecisionList rows={data.rows} />
      <div className={l.pages}>
        {data.historyPage > 1 ? (
          <Link href={'?routingPage=' + (data.historyPage - 1)}>Previous routing decisions</Link>
        ) : (
          <span />
        )}
        <span>
          Page {data.historyPage} of {data.pages}
        </span>
        {data.historyPage < data.pages ? (
          <Link href={'?routingPage=' + (data.historyPage + 1)}>Next routing decisions</Link>
        ) : (
          <span />
        )}
      </div>
    </section>
  );
}
export function DecisionList({ rows }: { rows: Awaited<ReturnType<typeof history>>['rows'] }) {
  return rows.length ? (
    <ol className={l.activity}>
      {rows.map((d) => (
        <li key={d.id}>
          <Link href={'/dashboard/leads/' + d.leadId}>{d.outcome}</Link> ·{' '}
          {d.selectedName ?? (d.explanation.selectedId ? 'Former account' : 'No member selected')} ·{' '}
          {d.reason}
          <small>
            {new Date(d.createdAt).toLocaleString('en-GB', { timeZone: 'UTC' })} UTC · {d.strategy}{' '}
            · policy {d.policyVersion} · {d.explanation.source}
          </small>
          {d.explanation.factors && (
            <p>
              Available when selected · active {d.explanation.factors.active}/
              {d.explanation.factors.capacity} · skill{' '}
              {d.explanation.factors.skillMatch ? 'matched' : 'not matched'}
              {d.strategy === 'HYBRID' && d.reason === 'MATCHED' && (
                <>
                  {' '}
                  · skill points {d.explanation.factors.skillPoints} + workload points{' '}
                  {d.explanation.factors.loadPoints}
                </>
              )}
            </p>
          )}
        </li>
      ))}
    </ol>
  ) : (
    <p>No automatic routing decisions yet.</p>
  );
}
