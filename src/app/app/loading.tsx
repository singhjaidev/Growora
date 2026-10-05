export default function Loading() {
  return (
    <div className="loading" role="status" aria-label="Loading workspace">
      <div className="skeleton short" />
      <div className="skeleton" />
      <p className="micro">PREPARING YOUR WORKSPACE</p>
    </div>
  );
}
