'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import s from './dashboard.module.css';

function useAccountMutation() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save(action: string, body: Record<string, string>, success: string) {
    if (busy) return false;
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/account/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (r.status === 401) {
        window.location.replace('/login');
        return false;
      }
      if (!r.ok) {
        setMessage((await r.json()).message || 'Please try again.');
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
  return { busy, message, setMessage, save };
}
export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [value, setValue] = useState(name);
  const { busy, message, setMessage, save } = useAccountMutation();
  async function submit(e: FormEvent) {
    e.preventDefault();
    const normalized = value.normalize('NFC').trim().replace(/ +/g, ' ');
    if (await save('profile', { name: normalized }, 'Profile saved.')) setValue(normalized);
  }
  return (
    <form className={s.panel} onSubmit={submit}>
      <h2>Account information</h2>
      <label>
        Display name
        <input
          autoComplete="name"
          required
          maxLength={100}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setMessage('');
          }}
          disabled={busy}
        />
      </label>
      <label>
        Registered email
        <input readOnly value={email} />
      </label>
      <div className={s.actions}>
        <button className={s.primary} disabled={busy || !value.trim() || value === name}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          disabled={busy || value === name}
          onClick={() => {
            setValue(name);
            setMessage('');
          }}
        >
          Cancel
        </button>
      </div>
      <p role="status">{message}</p>
    </form>
  );
}
type Session = { id: string; started: string; expires: string; current: boolean };
function SessionList({ sessions }: { sessions: Session[] | null }) {
  const { busy, message, save } = useAccountMutation();
  return (
    <section className={s.panel}>
      <h2>Active sessions</h2>
      {sessions === null ? (
        <p>Sign out and sign in again to view your active sessions.</p>
      ) : (
        <>
          <p>These sessions currently have access to your account. Times are in UTC.</p>
          <ul className={s.sessions}>
            {sessions.map((row) => (
              <li key={row.id}>
                <div>
                  <strong>{row.current ? 'Current session' : 'Other session'}</strong>
                  <small>
                    Started {new Date(row.started).toLocaleString('en-GB', { timeZone: 'UTC' })} ·
                    Expires {new Date(row.expires).toLocaleDateString('en-GB', { timeZone: 'UTC' })}
                  </small>
                </div>
                {!row.current && (
                  <button
                    disabled={busy}
                    onClick={() => save('revoke', { id: row.id }, 'Session revoked.')}
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
          {sessions.some((s) => !s.current) && (
            <button
              disabled={busy}
              onClick={() => save('revoke-others', {}, 'Other devices signed out.')}
            >
              Sign out all other devices
            </button>
          )}
        </>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
export function SecurityForms({ sessions }: { sessions: Session[] | null }) {
  const { busy, message, save } = useAccountMutation();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = new FormData(form);
    if (
      await save(
        'password',
        {
          currentPassword: String(fields.get('currentPassword')),
          newPassword: String(fields.get('newPassword')),
        },
        'Password changed. Other sessions have been signed out.',
      )
    )
      form.reset();
  }
  return (
    <>
      <form className={s.panel} onSubmit={submit}>
        <h2>Change password</h2>
        <p>Changing your password signs out your other sessions.</p>
        <label>
          Current password
          <input
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            maxLength={128}
            required
          />
        </label>
        <label>
          New password
          <input
            type="password"
            name="newPassword"
            autoComplete="new-password"
            minLength={15}
            maxLength={128}
            required
          />
          <small>Use at least 15 characters.</small>
        </label>
        <div className={s.actions}>
          <button className={s.primary} disabled={busy}>
            {busy ? 'Saving…' : 'Change password'}
          </button>
          <Link href="/forgot-password">Forgot your password?</Link>
        </div>
        <p role="status">{message}</p>
      </form>
      <SessionList sessions={sessions} />
    </>
  );
}
