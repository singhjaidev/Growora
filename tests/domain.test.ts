import test from 'node:test';
import assert from 'node:assert/strict';
import { qualify, createLead, metrics, type LeadInput } from '../src/lib/domain.ts';
import { reportingWindow, inReportingWindow, percentage } from '../src/lib/reporting.ts';
import { evaluateFlow, executionPath, sampleEnquiry } from '../src/lib/automation-flow.ts';
import { insertLead } from '../src/lib/lead-store.ts';
const input: LeadInput = {
  name: 'Test Person',
  company: 'Sample Studio',
  email: 'test@example.com',
  service: 'Website redesign',
  budget: '£5,000–£10,000',
  timeline: 'Within 30 days',
};
test('high-intent lead receives the documented score and priority route', () => {
  assert.deepEqual(qualify(input), {
    value: 7500,
    score: 91,
    priority: 'High',
    route: 'Priority sales queue',
    action: 'Contact within 10 minutes',
  });
});
test('an exploratory low-budget lead is nurtured instead of sent to priority sales', () => {
  const result = qualify({ ...input, budget: 'Under £2,000', timeline: 'Just exploring' });
  assert.equal(result.score, 47);
  assert.equal(result.priority, 'Nurture');
  assert.equal(result.route, 'Nurture sequence');
});
test('mid-range enquiry receives the discovery route', () => {
  const result = qualify({ ...input, budget: '£2,000–£5,000', timeline: '1–3 months' });
  assert.equal(result.score, 69);
  assert.equal(result.priority, 'Medium');
});
test('lead creation preserves inputs and produces unique identities', () => {
  const first = createLead(input);
  const second = createLead(input);
  assert.notEqual(first.id, second.id);
  assert.equal(first.name, input.name);
  assert.equal(first.email, input.email);
  assert.equal(first.status, 'Qualified');
  assert.equal(first.owner, 'Jamie Lee');
  assert.equal(first.source, 'Website demo');
});
test('workspace metrics respond to pipeline changes and handle an empty workspace', () => {
  const a = createLead(input);
  const b = { ...createLead(input), status: 'Won' as const };
  assert.deepEqual(metrics([a, b]), { count: 2, qualified: 2, value: 7500, conversion: '50.0' });
  assert.deepEqual(metrics([]), { count: 0, qualified: 0, value: 0, conversion: '0.0' });
});
test('capture insertion is idempotent and preserves existing records', () => {
  const lead = createLead(input);
  const rows = insertLead([], lead);
  assert.equal(insertLead(rows, lead), rows);
  assert.equal(rows.length, 1);
});
test('budget rules have strict boundaries and finite execution paths', () => {
  assert.equal(evaluateFlow('high-value', '2000', sampleEnquiry), true);
  assert.equal(evaluateFlow('high-value', '10000', sampleEnquiry), false);
  assert.equal(evaluateFlow('high-value', '7500', sampleEnquiry), false);
  assert.equal(evaluateFlow('high-value', '', sampleEnquiry), false);
  assert.deepEqual(executionPath(false), [0, 1, 7]);
  assert.deepEqual(executionPath(true), [0, 1, 2, 3, 4, 5, 6]);
});
test('each automation condition evaluates its own enquiry fields', () => {
  for (const id of ['instant-response', 'no-response', 'demo-request', 'nurture'])
    assert.equal(evaluateFlow(id, '2000', sampleEnquiry), true);
  const no = {
    ...sampleEnquiry,
    email: 'invalid',
    replied: true,
    volume: 50,
    timeline: 'Within 30 days',
  };
  for (const id of ['instant-response', 'no-response', 'demo-request', 'nurture'])
    assert.equal(evaluateFlow(id, '2000', no), false);
});
test('reporting uses inclusive UTC start and exclusive end with a shared latest-record anchor', () => {
  const lead = createLead(input);
  const rows = [
    { ...lead, id: 'latest', created: '2026-10-04T12:30:00Z' },
    { ...lead, id: 'start', created: '2026-09-28T00:00:00Z' },
    { ...lead, id: 'before', created: '2026-09-27T23:59:59Z' },
  ];
  const window = reportingWindow(rows, 7);
  assert.equal(window.start, Date.parse('2026-09-28T00:00:00Z'));
  assert.equal(window.end, Date.parse('2026-10-05T00:00:00Z'));
  assert.deepEqual(
    inReportingWindow(rows, window).map((l) => l.id),
    ['latest', 'start'],
  );
  assert.equal(inReportingWindow([{ ...lead, created: '2026-10-05T00:00:00Z' }], window).length, 0);
  assert.equal(percentage(0, 0), 0);
  assert.equal(percentage(1, 4), 25);
  assert.equal(percentage(Infinity, 4), 0);
});
