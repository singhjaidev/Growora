'use client';
export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <section role="alert">
      <h2>Couldn’t load your account</h2>
      <p>Please try again.</p>
      <button onClick={reset}>Retry</button>
    </section>
  );
}
