'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { insights } from '@/server/intelligence/service';
import s from '@/components/dashboard/dashboard.module.css';
import l from './leads.module.css';
type Data = Awaited<ReturnType<typeof insights>>;
export function AIInsights({
  workspaceId,
  leadId,
  data,
}: {
  workspaceId: string;
  leadId: string;
  data: Data;
}) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const current = data.current,
    job = data.history.find((j) => j.generation === current?.generation),
    result = job?.result;
  useEffect(() => {
    if (!current || !['PENDING', 'PROCESSING'].includes(current.status) || !data.configured) return;
    const timer = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(timer);
  }, [current, data.configured, router]);
  async function save(action: string, fields: Record<string, unknown> = {}) {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/intelligence/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          id: leadId,
          generation: current?.generation ?? 0,
          ...fields,
        }),
      });
      if (r.status === 401) {
        router.replace('/login');
        return;
      }
      const body = await r.json();
      setMessage(
        r.ok
          ? action === 'analyze'
            ? 'Analysis queued.'
            : 'Review saved.'
          : (body.message ?? 'Unable to save.'),
      );
      router.refresh();
    } catch {
      setMessage('Unable to reach Growora. Please retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={s.panel}>
      <h2>AI Insights</h2>
      <p>
        Advisory AI interpretation. Review it against the original enquiry. Priority is a heuristic,
        not a conversion probability.
      </p>
      <p>
        <strong>
          {!data.configured && !result
            ? 'Unavailable · processing configuration required'
            : (current?.status ?? 'Not analyzed')}
        </strong>
        {job?.errorCode && data.configured
          ? ' · ' + job.errorCode.replaceAll('_', ' ').toLowerCase()
          : ''}
      </p>
      {!data.configured && (
        <p>
          External processing requires provider credentials and an approved processing policy for
          this workspace. The original enquiry is safely stored.
        </p>
      )}
      {result && (
        <>
          <h3>AI interpretation</h3>
          <p className={l.message}>{result.extraction.interpretation.summary}</p>
          <dl className={s.facts}>
            <div>
              <dt>Intent</dt>
              <dd>{result.extraction.interpretation.intent}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{result.extraction.interpretation.category ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt>Priority heuristic</dt>
              <dd>
                {result.scoring.value}/100 · {result.scoring.label}
              </dd>
            </div>
            <div>
              <dt>Urgency interpretation</dt>
              <dd>{result.extraction.interpretation.urgency}</dd>
            </div>
          </dl>
          <h3>Customer-stated excerpts</h3>
          <dl className={s.facts}>
            {Object.entries(result.extraction.facts).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{Array.isArray(v) ? v.join('; ') || 'Not provided' : (v ?? 'Not provided')}</dd>
              </div>
            ))}
          </dl>
          <h3>Score breakdown</h3>
          <ul>
            {result.scoring.breakdown.map((b) => (
              <li key={b.factor}>
                {b.factor}: {b.points}/{b.max} — {b.reason}
              </li>
            ))}
          </ul>
          <h3>Missing information</h3>
          <p>
            {result.extraction.interpretation.missing.join(', ') ||
              'No missing details identified by the model.'}
          </p>
          <h3>Suggested clarification questions</h3>
          <ul>
            {result.extraction.interpretation.questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
          {result.extraction.interpretation.warnings.length > 0 && (
            <>
              <h3>Review warnings</h3>
              <ul>
                {result.extraction.interpretation.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </>
          )}
          <h3>Suggested next action</h3>
          <p>{result.scoring.nextAction}</p>
          <small>
            {job?.processedAt
              ? new Date(job.processedAt).toLocaleString('en-GB', { timeZone: 'UTC' }) + ' UTC'
              : ''}{' '}
            · {job?.model} · {job?.promptVersion} / {job?.schemaVersion} / {job?.scoringVersion}
          </small>
          {job?.review && (
            <p>
              Human review: {job.review} {job.reviewNote && '— ' + job.reviewNote}
            </p>
          )}
          {data.canReview && !job?.review && (
            <form
              className={l.fields}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void save('review', { verdict: f.get('verdict'), note: f.get('note') });
              }}
            >
              <label>
                Review verdict
                <select name="verdict">
                  <option value="ACCEPTED">Reviewed — acceptable</option>
                  <option value="FLAGGED">Flag incorrect interpretation</option>
                </select>
              </label>
              <label>
                Review note
                <textarea name="note" maxLength={1000} rows={3} />
              </label>
              <button disabled={busy}>Save AI review</button>
            </form>
          )}
        </>
      )}
      {data.canAnalyze && (
        <div className={s.actions}>
          <button
            disabled={
              busy || !data.configured || ['PENDING', 'PROCESSING'].includes(current?.status ?? '')
            }
            onClick={() => save('analyze')}
          >
            {busy ? 'Saving…' : current ? 'Request reanalysis' : 'Analyze enquiry'}
          </button>
          <button disabled={busy} onClick={() => router.refresh()}>
            Refresh insights
          </button>
        </div>
      )}
      {data.history.length > 1 && (
        <details>
          <summary>Previous analysis versions</summary>
          {data.history
            .filter((h) => h.generation !== current?.generation)
            .map((h) => (
              <p key={h.id}>
                Version {h.generation}: {h.status} · {h.model ?? 'No model call'} ·{' '}
                {h.review ?? 'Not reviewed'}
                {h.reviewNote ? ' — ' + h.reviewNote : ''}
              </p>
            ))}
        </details>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
