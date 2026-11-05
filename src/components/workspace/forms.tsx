'use client';
import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { mayAssign, mayManage, permissions } from '@/lib/workspace-policy';
import type { team, listWorkspaces } from '@/server/workspace/access';
import s from '@/components/dashboard/dashboard.module.css';
import w from './workspace.module.css';

function useMutation() {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function run(
    action: string,
    fields: Record<string, string>,
    success: string,
    destination?: string,
  ) {
    if (busy) return false;
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/workspaces/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!r.ok) {
        setMessage((await r.json()).message || 'Unable to complete this action.');
        return false;
      }
      if (destination) window.location.assign(destination);
      else {
        setMessage(success);
        router.refresh();
      }
      return true;
    } catch {
      setMessage('Could not reach Growora. Try again.');
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, message, run };
}
export function Selector({
  rows,
  active,
}: {
  rows: Awaited<ReturnType<typeof listWorkspaces>>;
  active?: string;
}) {
  const { busy, message, run } = useMutation();
  if (!rows.length) return null;
  return (
    <div className={w.selectBox}>
      <label>
        Active workspace
        <select
          value={active}
          disabled={busy}
          onChange={(e) =>
            run('switch', { workspaceId: e.target.value }, '', '/dashboard/workspace')
          }
        >
          {rows.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} · {r.role}
            </option>
          ))}
        </select>
      </label>
      <small role="status">{message}</small>
    </div>
  );
}
const fields = [
  ['name', 'Business name', 120],
  ['industry', 'Industry', 80],
  ['location', 'Location', 120],
  ['website', 'Website', 400],
  ['description', 'Description', 500],
] as const;
type Business = {
  id: string;
  name: string;
  industry: string;
  location: string;
  description: string;
  website: string;
};
export function BusinessForm({ business }: { business?: Business }) {
  const { busy, message, run } = useMutation();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    for (const [key] of fields) values[key] = String(form.get(key) ?? '');
    if (business) values.workspaceId = business.id;
    await run(
      business ? 'settings' : 'create',
      values,
      'Workspace saved.',
      business ? undefined : '/dashboard/workspace',
    );
  }
  return (
    <form className={s.panel} onSubmit={submit}>
      <h2>{business ? 'Business profile' : 'Create a workspace'}</h2>
      <p>
        {business
          ? 'Update the business details your team sees.'
          : 'Give your business a private space. You can invite your team after creating it.'}
      </p>
      {fields.map(([key, label, max]) => (
        <label key={key}>
          {label}
          {key === 'name' ? '' : ' (optional)'}
          <input
            name={key}
            type={key === 'website' ? 'url' : 'text'}
            defaultValue={business?.[key] ?? ''}
            maxLength={max}
            required={key === 'name'}
          />
        </label>
      ))}
      <button className={s.primary} disabled={busy}>
        {busy ? 'Saving…' : business ? 'Save workspace' : 'Create workspace'}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
export function TeamPanel({
  data,
  userId,
}: {
  data: Awaited<ReturnType<typeof team>>;
  userId: string;
}) {
  const { busy, message, run } = useMutation();
  const { id, role } = data;
  const act = (action: string, f: Record<string, string>, success: string) =>
    run(action, { workspaceId: id, ...f }, success);
  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = new FormData(form);
    if (
      await act(
        'invite',
        { email: String(values.get('email')), role: String(values.get('role')) },
        'Invitation email accepted for delivery.',
      )
    )
      form.reset();
  }
  return (
    <>
      <section className={s.panel}>
        <h2>Members</h2>
        <ul className={s.sessions}>
          {data.members.map((m) => (
            <li key={m.id} className={w.row}>
              <div>
                <strong>
                  {m.name}
                  {m.id === userId ? ' (you)' : ''}
                </strong>
                <small>
                  {m.email} · {m.role} · Joined{' '}
                  {new Date(m.joined).toLocaleDateString('en-GB', { timeZone: 'UTC' })}
                </small>
              </div>
              {m.id !== userId && mayManage(role, m.role) && (
                <div className={s.actions}>
                  {role === 'OWNER' && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        act(
                          'role',
                          { memberId: m.id, role: m.role === 'ADMIN' ? 'MEMBER' : 'ADMIN' },
                          'Role updated.',
                        )
                      }
                    >
                      Make {m.role === 'ADMIN' ? 'member' : 'admin'}
                    </button>
                  )}
                  <button
                    disabled={busy}
                    onClick={() =>
                      window.confirm('Remove this member from the workspace?') &&
                      act('remove', { memberId: m.id }, 'Member removed.')
                    }
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {permissions[role].leave && (
          <button
            disabled={busy}
            onClick={() =>
              window.confirm('Leave this workspace?') &&
              run('leave', { workspaceId: id }, '', '/dashboard/workspace')
            }
          >
            Leave workspace
          </button>
        )}
      </section>
      {permissions[role].assign.length > 0 && (
        <>
          <form className={s.panel} onSubmit={invite}>
            <h2>Invite a teammate</h2>
            <label>
              Email address
              <input name="email" type="email" required maxLength={254} />
            </label>
            <label>
              Invitation role
              <select name="role" className={w.select} defaultValue="MEMBER">
                {permissions[role].assign.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <button disabled={busy} className={s.primary}>
              Send invitation
            </button>
          </form>
          <section className={s.panel}>
            <h2>Pending invitations</h2>
            {!data.invites.length && <p>No pending invitations.</p>}
            <ul className={s.sessions}>
              {data.invites.map((i) => (
                <li key={i.id} className={w.row}>
                  <div>
                    {i.email}
                    <small>
                      {i.role} · Expires{' '}
                      {new Date(i.expiresAt).toLocaleDateString('en-GB', { timeZone: 'UTC' })}
                    </small>
                  </div>
                  {mayAssign(role, i.role) && (
                    <button
                      disabled={busy}
                      onClick={() => act('cancel', { inviteId: i.id }, 'Invitation revoked.')}
                    >
                      Revoke invitation
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      <p role="status">{busy ? 'Saving…' : message}</p>
    </>
  );
}
export function JoinForm() {
  const token = useRef('');
  const [ready, setReady] = useState(false),
    [sent, setSent] = useState(false);
  const { busy, message, run } = useMutation();
  useEffect(() => {
    if (location.hash) {
      token.current = new URLSearchParams(location.hash.slice(1)).get('token') ?? '';
      history.replaceState(null, '', location.pathname);
    }
    setReady(Boolean(token.current));
  }, []);
  async function accept(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await run(
      'accept',
      { token: token.current, code: String(new FormData(e.currentTarget).get('code')) },
      '',
      '/dashboard/workspace',
    );
  }
  return (
    <section className={s.panel}>
      <h2>Join your team</h2>
      {!ready ? (
        <p>Open the invitation from your workspace email.</p>
      ) : (
        <>
          <p>
            Sign in with the invited email address. If needed, open{' '}
            <Link href="/login" target="_blank" rel="noopener">
              login
            </Link>{' '}
            or{' '}
            <Link href="/signup" target="_blank" rel="noopener">
              signup
            </Link>{' '}
            in a new tab, then return here.
          </p>
          <button
            disabled={busy}
            onClick={async () => {
              if (
                await run(
                  'challenge',
                  { token: token.current },
                  'Check your mailbox for the eight-digit confirmation code.',
                )
              )
                setSent(true);
            }}
          >
            {sent ? 'Send another code' : 'Send confirmation code'}
          </button>
          {sent && (
            <form onSubmit={accept}>
              <label>
                Confirmation code
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  pattern="[0-9]{8}"
                  maxLength={8}
                />
              </label>
              <button className={s.primary} disabled={busy}>
                Accept invitation
              </button>
            </form>
          )}
        </>
      )}
      <p role="status">{busy ? 'Please wait…' : message}</p>
    </section>
  );
}
