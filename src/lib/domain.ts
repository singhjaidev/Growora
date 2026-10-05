export const stages = ['New', 'Qualified', 'Contacted', 'Proposal', 'Won'] as const;
export type Stage = (typeof stages)[number];
export type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  service: string;
  budget: string;
  timeline: string;
  value: number;
  score: number;
  status: Stage;
  source: string;
  owner: string;
  created: string;
  updated?: string;
  notes: string;
  activity: string[];
};
export type LeadInput = Pick<
  Lead,
  'name' | 'company' | 'email' | 'service' | 'budget' | 'timeline'
>;
export function qualify(input: LeadInput) {
  const value =
    (
      {
        'Under £2,000': 1500,
        '£2,000–£5,000': 3500,
        '£5,000–£10,000': 7500,
        '£10,000+': 15000,
      } as Record<string, number>
    )[input.budget] ?? 1500;
  const score = Math.min(
    99,
    30 +
      (value >= 7500 ? 35 : value >= 3500 ? 22 : 8) +
      (input.timeline === 'Within 30 days' ? 21 : input.timeline === '1–3 months' ? 12 : 4) +
      (input.company.trim() ? 5 : 0),
  );
  return {
    value,
    score,
    priority: score >= 75 ? 'High' : score >= 55 ? 'Medium' : 'Nurture',
    route:
      score >= 75
        ? 'Priority sales queue'
        : score >= 55
          ? 'Discovery consultation'
          : 'Nurture sequence',
    action:
      score >= 75
        ? 'Contact within 10 minutes'
        : score >= 55
          ? 'Schedule a discovery call'
          : 'Send a helpful project guide',
  };
}
export function createLead(input: LeadInput): Lead {
  const result = qualify(input);
  return {
    ...input,
    id: crypto.randomUUID(),
    value: result.value,
    score: result.score,
    status: result.score >= 75 ? 'Qualified' : 'New',
    source: 'Website demo',
    owner: result.score >= 75 ? 'Jamie Lee' : 'Unassigned',
    created: new Date().toISOString(),
    notes: '',
    activity: [
      'Lead captured from website',
      'Qualification completed',
      `Routed to ${result.route.toLowerCase()}`,
    ],
  };
}
export function nextAction(lead: Lead) {
  if (lead.status === 'Won') return 'Plan the project handover';
  if (lead.status === 'Proposal') return 'Follow up on the proposal';
  if (lead.status === 'Contacted') return 'Agree the next conversation';
  return qualify(lead).action;
}
export const money = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);
export function metrics(leads: Lead[]) {
  return {
    count: leads.length,
    qualified: leads.filter((l) => l.score >= 75).length,
    value: leads.filter((l) => l.status !== 'Won').reduce((a, l) => a + l.value, 0),
    conversion: leads.length
      ? ((leads.filter((l) => l.status === 'Won').length / leads.length) * 100).toFixed(1)
      : '0.0',
  };
}
