import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluate,
  defaultPolicy,
  policyInput,
  skill,
  type Candidate,
  type Strategy,
} from '../src/server/routing/engine.ts';
const a: Candidate = {
  id: 'a',
  eligible: true,
  available: true,
  capacity: 10,
  skills: ['packaging'],
  active: 0,
  lastAssignedAt: null,
};
const b: Candidate = { ...a, id: 'b', skills: ['software'] };
const lead = { status: 'NEW', assignedId: null, skill: null, source: 'NONE' as const };
const run = (strategy: Strategy, members = [a, b], features = {}, rules = {}) =>
  evaluate({ ...defaultPolicy, enabled: true, strategy, version: 7, ...rules }, members, {
    ...lead,
    ...features,
  });
test('manual default, closed leads and human assignments never auto-assign', () => {
  assert.equal(evaluate(defaultPolicy, [a], lead).reason, 'ROUTING_DISABLED');
  assert.equal(run('ROUND_ROBIN', [a], { status: 'CLOSED' }).reason, 'LEAD_CLOSED');
  assert.equal(run('ROUND_ROBIN', [a], { assignedId: 'b' }).reason, 'EXISTING_ASSIGNMENT');
});
test('round robin uses persistent age and deterministic ID ties without mutating input', () => {
  assert.equal(run('ROUND_ROBIN', [b, a]).selectedId, 'a');
  assert.equal(run('ROUND_ROBIN', [{ ...a, lastAssignedAt: '2026-01-01' }, b]).selectedId, 'b');
  assert.equal(a.lastAssignedAt, null);
});
test('least loaded uses actual active count then fairness', () => {
  assert.equal(run('LEAST_LOADED', [{ ...a, active: 3 }, b]).selectedId, 'b');
  assert.equal(run('LEAST_LOADED', [b, a]).selectedId, 'a');
});
test('skill routing requires a validated specialty or explicit fallback', () => {
  assert.equal(run('SKILL').reason, 'CATEGORY_UNKNOWN');
  assert.equal(run('SKILL', [a, b], { skill: 'consulting' }).reason, 'NO_SKILL_MATCH');
  assert.equal(run('SKILL', [a, b], { skill: 'packaging', source: 'FORM_POLICY' }).selectedId, 'a');
  assert.equal(
    run('SKILL', [a, b], {}, { fallback: 'LEAST_LOADED' }).reason,
    'FALLBACK_CATEGORY_UNKNOWN',
  );
});
test('hybrid weights transparently balance skills and fractional capacity', () => {
  const members = [{ ...a, active: 9 }, b];
  const selected = run('HYBRID', members, { skill: 'packaging' });
  assert.equal(selected.selectedId, 'a');
  assert.equal(selected.factors?.total, 73);
  assert.equal(
    run('HYBRID', members, { skill: 'packaging' }, { skillWeight: 10, loadWeight: 90 }).selectedId,
    'b',
  );
  assert.equal(run('HYBRID', members, { skill: 'consulting' }).reason, 'NO_SKILL_MATCH');
});
test('availability eligibility and capacity are hard exclusions under every strategy', () => {
  for (const mode of ['ROUND_ROBIN', 'LEAST_LOADED', 'SKILL', 'HYBRID'] as Strategy[]) {
    const d = run(
      mode,
      [
        { ...a, active: 10 },
        { ...b, available: false },
        { ...a, id: 'c', eligible: false },
      ],
      { skill: 'packaging' },
    );
    assert.equal(d.selectedId, null);
    assert.deepEqual(d.exclusions, { capacity: 1, unavailable: 1, disabled: 1 });
  }
  assert.equal(run('ROUND_ROBIN', [{ ...a, available: false }]).reason, 'MEMBERS_UNAVAILABLE');
});
test('policy validation rejects unsafe weights, scripts, duplicates and malformed categories', () => {
  assert.equal(skill('  Packaging '), 'packaging');
  for (const patch of [
    { skillWeight: -1, loadWeight: 101 },
    { skillWeight: 70.5, loadWeight: 29.5 },
    { enabled: 'true' },
    { strategy: 'eval' },
    { formSkills: [{ formId: 'bad', skill: 'x' }] },
  ])
    assert.throws(() => policyInput({ ...defaultPolicy, ...patch }));
  assert.throws(() => skill('<script>'));
  assert.equal(policyInput(defaultPolicy).fallback, 'REVIEW');
});
