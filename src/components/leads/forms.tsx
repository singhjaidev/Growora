'use client';
import Link from 'next/link';
import { useState, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { forms, detail } from '@/server/leads/service';
import type { publicForm } from '@/server/leads/ingestion';
import { transitions } from '@/lib/lead-policy';
import s from '@/components/dashboard/dashboard.module.css';
import l from './leads.module.css';

function useMutation(workspaceId: string) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function save(action: string, fields: Record<string, unknown>, success: string) {
    if (busy) return false;
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/leads/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, ...fields }),
      });
      if (r.status === 401) {
        window.location.replace('/login');
        return false;
      }
      if (!r.ok) {
        setMessage((await r.json()).message || 'Unable to save.');
        return false;
      }
      setMessage(success);
      router.refresh();
      return true;
    } catch {
      setMessage('Could not reach Growora. Please try again.');
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, message, save };
}
type FormRow = Awaited<ReturnType<typeof forms>>[number];
const defaultNotice =
  'Your contact details and enquiry will be stored by this business in Growora and used by its authorized team to respond to your request. Please avoid sending sensitive personal information.';
export function FormEditor({ workspaceId, form }: { workspaceId: string; form?: FormRow }) {
  const { busy, message, save } = useMutation(workspaceId);
  const [copyMessage, setCopyMessage] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const element = e.currentTarget,
      values = new FormData(element);
    const fields = {
      name: String(values.get('name')),
      privacyNotice: String(values.get('privacyNotice')),
      enabled: values.get('enabled') === 'on',
      retentionDays: values.get('retentionDays') ? Number(values.get('retentionDays')) : null,
    };
    if (
      await save(
        form ? 'form-update' : 'form-create',
        form ? { ...fields, id: form.id, version: form.version } : fields,
        form ? 'Form settings saved.' : 'Form created. Its share link is listed below.',
      )
    ) {
      if (!form) element.reset();
    }
  }
  const url = form ? '/enquiry/' + form.publicId : '';
  return (
    <section className={s.panel}>
      <h2>{form ? form.name : 'Create an enquiry form'}</h2>
      {form && (
        <>
          <p>
            {form.enabled ? 'Accepting enquiries' : 'Submissions disabled'} · {form.submissions}{' '}
            submissions
          </p>
          <div className={s.actions}>
            <Link href={url} target="_blank" rel="noopener">
              Open public form
            </Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(new URL(url, location.origin).href);
                  setCopyMessage('Link copied.');
                } catch {
                  setCopyMessage('Copy the public link below.');
                }
              }}
            >
              Copy link
            </button>
          </div>
          <p className={l.share}>
            <Link href={url}>{url}</Link>
          </p>
          <p role="status">{copyMessage}</p>
        </>
      )}
      <form onSubmit={submit} className={l.fields}>
        <label>
          Public form title
          <input name="name" defaultValue={form?.name} required maxLength={120} />
        </label>
        <label>
          Privacy notice
          <textarea
            name="privacyNotice"
            defaultValue={form?.privacyNotice ?? defaultNotice}
            required
            maxLength={1000}
            rows={4}
          />
        </label>
        <label>
          Review submissions after (days)
          <input
            name="retentionDays"
            type="number"
            min={1}
            max={3650}
            defaultValue={form?.retentionDays ?? ''}
          />
          <small>
            Optional. Schedules a retention review for new enquiries. Deletion requires a separate
            confirmed action.
          </small>
        </label>
        <label className={l.check}>
          <input name="enabled" type="checkbox" defaultChecked={form?.enabled ?? true} /> Accept
          submissions
        </label>
        <button className={s.primary} disabled={busy}>
          {busy ? 'Saving…' : form ? 'Save form' : 'Create form'}
        </button>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
type Detail = Awaited<ReturnType<typeof detail>>;
export function LeadControls({ workspaceId, data }: { workspaceId: string; data: Detail }) {
  const { busy, message, save } = useMutation(workspaceId),
    router = useRouter();
  const row = data.lead;
  async function change(e: FormEvent<HTMLFormElement>, action: 'status' | 'assign') {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get(action);
    await save(
      action,
      {
        id: row.id,
        version: row.version,
        ...(action === 'status' ? { status: value } : { assignee: value || null }),
      },
      action === 'status' ? 'Status updated.' : 'Assignment updated.',
    );
  }
  return (
    <section className={s.panel}>
      <h2>Manage enquiry</h2>
      <div className={l.controls}>
        <form onSubmit={(e) => change(e, 'status')} className={l.fields}>
          <label>
            Status
            <select name="status" defaultValue={row.status} key={row.version}>
              {[row.status, ...transitions[row.status]].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <button disabled={busy}>Update status</button>
        </form>
        {data.canManage && (
          <form onSubmit={(e) => change(e, 'assign')} className={l.fields}>
            <label>
              Assigned to
              <select name="assign" defaultValue={row.assignedToUserId ?? ''} key={row.version}>
                <option value="">Unassigned</option>
                {data.assignees.map((m) => (
                  <option value={m.id} key={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <button disabled={busy}>Save assignment</button>
          </form>
        )}
      </div>
      <p role="status">{message}</p>
      {message && (
        <button type="button" disabled={busy} onClick={() => router.refresh()}>
          Refresh enquiry
        </button>
      )}
      {data.canManage && (
        <details className={l.delete}>
          <summary>Data retention</summary>
          <p>
            Review date:{' '}
            {row.reviewAt
              ? new Date(row.reviewAt).toLocaleDateString('en-GB', { timeZone: 'UTC' })
              : 'Not scheduled'}
            . Deleting removes the customer details and activity history.
          </p>
          <button
            disabled={busy}
            onClick={async () => {
              if (
                window.confirm('Permanently delete this enquiry and its activity history?') &&
                (await save('delete', { id: row.id, version: row.version }, 'Enquiry deleted.'))
              )
                router.push('/dashboard/leads');
            }}
          >
            Delete enquiry
          </button>
        </details>
      )}
    </section>
  );
}
export function PublicEnquiry({
  form,
}: {
  form: NonNullable<Awaited<ReturnType<typeof publicForm>>>;
}) {
  const [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState('');
  const key = useRef(''),
    payload = useRef(''),
    inFlight = useRef(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    const data = new FormData(e.currentTarget);
    const fields = {
      formVersion: form.version,
      customerName: data.get('customerName'),
      customerEmail: data.get('customerEmail'),
      customerPhone: data.get('customerPhone'),
      subject: data.get('subject'),
      message: data.get('message'),
      company: data.get('company'),
      consent: data.get('consent') === 'on',
    };
    const body = JSON.stringify(fields);
    if (payload.current !== body) {
      key.current = crypto.randomUUID();
      payload.current = body;
    }
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/enquiry/' + form.publicId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key.current },
        body,
      });
      if (!r.ok) {
        setError((await r.json()).message || 'Unable to send this enquiry.');
        return;
      }
      setDone(true);
    } catch {
      setError(
        'Could not confirm your submission. Please try again; the same enquiry will be saved only once.',
      );
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  return (
    <section className={s.panel}>
      {done ? (
        <div role="status">
          <h2>Enquiry received</h2>
          <p>Your enquiry has been saved for the business to review.</p>
        </div>
      ) : (
        <form onSubmit={submit} className={l.fields}>
          <label>
            Your name
            <input
              name="customerName"
              autoComplete="name"
              maxLength={120}
              required
              disabled={busy}
            />
          </label>
          <label>
            Email address
            <input
              name="customerEmail"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              disabled={busy}
            />
          </label>
          <label>
            Phone number (optional)
            <input
              name="customerPhone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              disabled={busy}
            />
          </label>
          <label>
            Subject
            <input name="subject" maxLength={160} required disabled={busy} />
          </label>
          <label>
            Message
            <textarea name="message" maxLength={4000} rows={6} required disabled={busy} />
          </label>
          <div className={l.honeypot} aria-hidden="true">
            <label>
              Company
              <input name="company" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <p className={l.message}>{form.privacyNotice}</p>
          <label className={l.check}>
            <input name="consent" type="checkbox" required disabled={busy} /> I acknowledge this use
            of my information.
          </label>
          {form.retentionDays && (
            <p>The business schedules a review of this enquiry after {form.retentionDays} days.</p>
          )}
          {error && <p role="alert">{error}</p>}
          <button disabled={busy} className={s.primary}>
            {busy ? 'Sending…' : 'Send enquiry'}
          </button>
        </form>
      )}
    </section>
  );
}
