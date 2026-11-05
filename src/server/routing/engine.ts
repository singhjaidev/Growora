export const strategies = ['MANUAL', 'ROUND_ROBIN', 'LEAST_LOADED', 'SKILL', 'HYBRID'] as const;
export type Strategy = (typeof strategies)[number];
export type Policy = {
  enabled: boolean;
  strategy: Strategy;
  version: number;
  fallback: 'REVIEW' | 'LEAST_LOADED';
  skillWeight: number;
  loadWeight: number;
  useReviewedAI: boolean;
  formSkills: { formId: string; skill: string }[];
};
export const defaultPolicy: Policy = {
  enabled: false,
  strategy: 'MANUAL',
  version: 0,
  fallback: 'REVIEW',
  skillWeight: 70,
  loadWeight: 30,
  useReviewedAI: false,
  formSkills: [],
};
export type Candidate = {
  id: string;
  eligible: boolean;
  available: boolean;
  capacity: number;
  skills: string[];
  active: number;
  lastAssignedAt: string | null;
};
export type Decision = {
  outcome: 'ASSIGNED' | 'REVIEW' | 'SKIPPED';
  reason: string;
  selectedId: string | null;
  strategy: Strategy;
  policyVersion: number;
  source: 'FORM_POLICY' | 'REVIEWED_AI' | 'NONE';
  skill: string | null;
  factors: {
    active: number;
    capacity: number;
    skillMatch: boolean;
    skillPoints: number;
    loadPoints: number;
    total: number;
  } | null;
  eligibleCount: number;
  exclusions: { disabled: number; unavailable: number; capacity: number };
  algorithmVersion: string;
};
export function evaluate(
  policy: Policy,
  members: Candidate[],
  lead: {
    status: string;
    assignedId: string | null;
    skill: string | null;
    source: Decision['source'];
  },
): Decision {
  const base: Decision = {
    outcome: 'REVIEW',
    reason: 'NO_ELIGIBLE_MEMBERS',
    selectedId: null,
    strategy: policy.strategy,
    policyVersion: policy.version,
    source: lead.source,
    skill: lead.skill,
    factors: null,
    eligibleCount: 0,
    exclusions: { disabled: 0, unavailable: 0, capacity: 0 },
    algorithmVersion: 'routing-1',
  };
  if (lead.status === 'CLOSED') return { ...base, outcome: 'SKIPPED', reason: 'LEAD_CLOSED' };
  if (lead.assignedId) return { ...base, outcome: 'SKIPPED', reason: 'EXISTING_ASSIGNMENT' };
  if (!policy.enabled || policy.strategy === 'MANUAL')
    return { ...base, outcome: 'SKIPPED', reason: 'ROUTING_DISABLED' };
  let eligible = members.filter((m) => {
    if (!m.eligible) {
      base.exclusions.disabled++;
      return false;
    }
    if (!m.available) {
      base.exclusions.unavailable++;
      return false;
    }
    if (m.active >= m.capacity) {
      base.exclusions.capacity++;
      return false;
    }
    return true;
  });
  base.eligibleCount = eligible.length;
  if (!eligible.length)
    return {
      ...base,
      reason: base.exclusions.capacity
        ? 'CAPACITY_REACHED'
        : base.exclusions.unavailable
          ? 'MEMBERS_UNAVAILABLE'
          : 'NO_ELIGIBLE_MEMBERS',
    };
  let mode = policy.strategy,
    reason = 'MATCHED';
  if (mode === 'SKILL' || mode === 'HYBRID') {
    if (!lead.skill) {
      if (policy.fallback === 'REVIEW') return { ...base, reason: 'CATEGORY_UNKNOWN' };
      mode = 'LEAST_LOADED';
      reason = 'FALLBACK_CATEGORY_UNKNOWN';
    } else if (mode === 'SKILL') {
      const skilled = eligible.filter((m) => m.skills.includes(lead.skill!));
      if (!skilled.length) {
        if (policy.fallback === 'REVIEW') return { ...base, reason: 'NO_SKILL_MATCH' };
        mode = 'LEAST_LOADED';
        reason = 'FALLBACK_NO_SKILL';
      } else eligible = skilled;
    } else if (!eligible.some((m) => m.skills.includes(lead.skill!))) {
      if (policy.fallback === 'REVIEW') return { ...base, reason: 'NO_SKILL_MATCH' };
      mode = 'LEAST_LOADED';
      reason = 'FALLBACK_NO_SKILL';
    }
  }
  const factors = (m: Candidate) => {
    const skillMatch = !!lead.skill && m.skills.includes(lead.skill);
    const skillPoints = skillMatch ? policy.skillWeight : 0,
      loadPoints = Math.round((1 - m.active / m.capacity) * policy.loadWeight * 100) / 100;
    return {
      active: m.active,
      capacity: m.capacity,
      skillMatch,
      skillPoints,
      loadPoints,
      total: Math.round((skillPoints + loadPoints) * 100) / 100,
    };
  };
  const fairness = (a: Candidate, b: Candidate) =>
    (a.lastAssignedAt ?? '').localeCompare(b.lastAssignedAt ?? '') || a.id.localeCompare(b.id);
  eligible.sort((a, b) =>
    mode === 'ROUND_ROBIN'
      ? fairness(a, b)
      : mode === 'HYBRID'
        ? factors(b).total - factors(a).total || a.active - b.active || fairness(a, b)
        : a.active - b.active || fairness(a, b),
  );
  const selected = eligible[0];
  return {
    ...base,
    outcome: 'ASSIGNED',
    reason,
    selectedId: selected.id,
    factors: factors(selected),
  };
}
export class RoutingInputError extends Error {}
function fail(): never {
  throw new RoutingInputError('Invalid routing configuration.');
}
export function skill(value: unknown) {
  if (typeof value !== 'string') fail();
  const s = value.normalize('NFC').trim().toLowerCase();
  if (!s || s.length > 60 || !/^[\p{L}\p{N}][\p{L}\p{N} &/._-]*$/u.test(s)) fail();
  return s;
}
export function policyInput(f: Record<string, unknown>) {
  if (
    typeof f.enabled !== 'boolean' ||
    !strategies.includes(f.strategy as Strategy) ||
    !['REVIEW', 'LEAST_LOADED'].includes(String(f.fallback)) ||
    typeof f.useReviewedAI !== 'boolean'
  )
    fail();
  if (
    !Number.isInteger(f.skillWeight) ||
    !Number.isInteger(f.loadWeight) ||
    Number(f.skillWeight) < 0 ||
    Number(f.loadWeight) < 0 ||
    Number(f.skillWeight) + Number(f.loadWeight) !== 100
  )
    fail();
  if (!Array.isArray(f.formSkills) || f.formSkills.length > 20) fail();
  const formSkills = f.formSkills.map((v) => {
    if (
      !v ||
      typeof v !== 'object' ||
      Object.keys(v).some((k) => !['formId', 'skill'].includes(k)) ||
      typeof v.formId !== 'string' ||
      !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v.formId)
    )
      fail();
    return { formId: v.formId, skill: skill(v.skill) };
  });
  if (new Set(formSkills.map((v) => v.formId)).size !== formSkills.length) fail();
  return {
    enabled: f.enabled,
    strategy: f.strategy as Strategy,
    fallback: f.fallback as Policy['fallback'],
    useReviewedAI: f.useReviewedAI,
    skillWeight: Number(f.skillWeight),
    loadWeight: Number(f.loadWeight),
    formSkills,
  };
}
