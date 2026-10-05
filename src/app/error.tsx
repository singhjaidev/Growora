'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <p className="kicker">A PAUSE IN THE FLOW</p>
      <h1>Let’s reconnect.</h1>
      <p>The workspace hit an unexpected issue. Your local data is still in this browser.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
      <Link className="button secondary" href="/">
        Return home
      </Link>
    </main>
  );
}
