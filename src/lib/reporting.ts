import type { Lead } from './domain';

const DAY = 86_400_000;
// A stable sample window moves forward when a newer local record is captured.
export function reportingWindow(records: Lead[], days = 30) {
  const latest = records.reduce(
    (end, lead) => Math.max(end, Date.parse(lead.created) || 0),
    Date.UTC(2026, 8, 26),
  );
  const date = new Date(latest);
  const end = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
  const length = days === 7 ? 7 : 30;
  return { start: end - length * DAY, end, days: length };
}
export function inReportingWindow(records: Lead[], window: ReturnType<typeof reportingWindow>) {
  return records.filter((lead) => {
    const date = Date.parse(lead.created);
    return date >= window.start && date < window.end;
  });
}
export function windowLabel(window: ReturnType<typeof reportingWindow>) {
  const format = (time: number) =>
    new Date(time).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  return `${format(window.start)} – ${format(window.end - 1)}`;
}
export function percentage(value: number, total: number) {
  return total > 0 && Number.isFinite(value) && Number.isFinite(total)
    ? Math.max(0, Math.min(100, (value / total) * 100))
    : 0;
}
