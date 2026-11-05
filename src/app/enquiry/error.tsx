'use client';
export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <h1>Unable to load this enquiry form</h1>
      <p>Please try again in a moment.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
