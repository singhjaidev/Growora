import Link from 'next/link';
export default function Unavailable() {
  return (
    <main id="main" className="error-page">
      <h1>Enquiry form unavailable</h1>
      <p>
        This form may be disabled or the link may be incorrect. Please contact the business for its
        current enquiry link.
      </p>
      <Link href="/">Return to Growora</Link>
    </main>
  );
}
