'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Logo } from '@/components/ui';
import s from './account.module.css';

const copy = {
  login: ['Welcome back', 'Sign in to your Growora account.', 'Sign in'],
  signup: ['Create your account', 'Create your account to sign in to Growora.', 'Create account'],
  forgot: [
    'Forgot your password?',
    'Enter your account email to request a reset link.',
    'Send reset link',
  ],
  reset: [
    'Choose a new password',
    'Use at least 15 characters. A few memorable words work well.',
    'Update password',
  ],
};
type Mode = keyof typeof copy;

export function AccountForm({ mode, localInbox = false }: { mode: Mode; localInbox?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const token = useRef('');
  useEffect(() => {
    if (mode === 'reset' && location.hash) {
      token.current = new URLSearchParams(location.hash.slice(1)).get('token') ?? '';
      history.replaceState(null, '', location.pathname);
    }
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    if (mode === 'reset') {
      if (!token.current) {
        setError('Open the link from your Growora email to continue.');
        return;
      }
      body.token = token.current;
    }
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/auth/' + mode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const data = await r.json();
        setError(
          r.status === 400 && mode === 'reset'
            ? 'This link is invalid or has expired.'
            : data.message || 'Please try again.',
        );
        return;
      }
      form.reset();
      if (mode === 'login' || mode === 'signup') window.location.replace('/dashboard');
      else {
        token.current = '';
        setDone(true);
      }
    } catch {
      setError('Could not reach Growora. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  const [heading, intro, button] = copy[mode];
  const success = {
    signup: '',
    forgot: 'If an account exists, a reset link will arrive shortly.',
    reset: 'Your password has been updated. Sign in with your new password.',
    login: '',
  };
  return (
    <main id="main" className={s.screen}>
      <section className={s.card}>
        <div className={s.header}>
          <Logo />
          <Link className={s.home} href="/">
            Back to home
          </Link>
        </div>
        <h1>{done ? 'All set' : heading}</h1>
        <p aria-live="polite">{done ? success[mode] : intro}</p>
        {done && localInbox && (
          <p>
            Open the newest message for your address in <code>.growora-local/inbox</code> in the
            project folder. Copy its link into this browser.
          </p>
        )}
        {!done && (
          <form onSubmit={submit} className={s.form}>
            {mode === 'signup' && (
              <label>
                Name
                <input name="name" autoComplete="name" maxLength={100} required />
              </label>
            )}
            {['signup', 'login', 'forgot'].includes(mode) && (
              <label>
                Email address
                <input type="email" name="email" autoComplete="email" maxLength={254} required />
              </label>
            )}
            {['signup', 'login', 'reset'].includes(mode) && (
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={mode === 'login' ? 1 : 15}
                  maxLength={128}
                  required
                />
                {mode === 'signup' && <small>Use at least 15 characters.</small>}
              </label>
            )}
            {mode === 'login' && <Link href="/forgot-password">Forgot your password?</Link>}
            {error && <p role="alert">{error}</p>}
            <button disabled={busy}>{busy ? 'Please wait…' : button}</button>
          </form>
        )}
        <div className={s.foot}>
          {mode === 'login' ? (
            <>
              New to Growora? <Link href="/signup">Create an account</Link>
            </>
          ) : (
            <Link href="/login">Return to sign in</Link>
          )}
          {mode === 'reset' && error && <Link href="/forgot-password">Request another link</Link>}
        </div>
      </section>
    </main>
  );
}
