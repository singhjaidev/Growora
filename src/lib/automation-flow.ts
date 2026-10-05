export type TestEnquiry = {
  budget: number;
  email: string;
  replied: boolean;
  volume: number;
  timeline: string;
};
export const sampleEnquiry: TestEnquiry = {
  budget: 7500,
  email: 'alex@example.com',
  replied: false,
  volume: 100,
  timeline: 'Just exploring',
};
export function evaluateFlow(id: string, threshold: string, input: TestEnquiry) {
  if (id === 'high-value')
    return (
      Number.isFinite(Number(threshold)) &&
      threshold.trim() !== '' &&
      input.budget > Number(threshold)
    );
  if (id === 'instant-response') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email);
  if (id === 'no-response') return !input.replied;
  if (id === 'demo-request') return input.volume > 50;
  if (id === 'nurture') return input.timeline === 'Just exploring';
  return false;
}
export function executionPath(passes: boolean) {
  return passes ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 7];
}
