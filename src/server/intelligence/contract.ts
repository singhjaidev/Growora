export const PROMPT_VERSION = 'qualification-1',
  SCHEMA_VERSION = 'extraction-1',
  SCORING_VERSION = 'priority-1';
export const priorities = ['HIGH', 'MEDIUM', 'LOW', 'NEEDS_REVIEW'] as const;
export const states = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'UNAVAILABLE'] as const;
export type Priority = (typeof priorities)[number];
export type State = (typeof states)[number];
export type Extraction = {
  facts: {
    requirement: string | null;
    quantity: string | null;
    budget: string | null;
    timeline: string | null;
    location: string | null;
    constraints: string[];
  };
  interpretation: {
    intent: 'PURCHASE' | 'RESEARCH' | 'SUPPORT' | 'UNKNOWN' | 'SPAM';
    category: string | null;
    summary: string;
    urgency: 'URGENT' | 'NORMAL' | 'UNKNOWN';
    missing: string[];
    questions: string[];
    warnings: string[];
  };
};
const string = { type: 'string', minLength: 1, maxLength: 500 };
const nullable = { anyOf: [string, { type: 'null' }] };
const strings = { type: 'array', items: string, maxItems: 10 };
const object = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
export const extractionSchema = object({
  facts: object({
    requirement: nullable,
    quantity: nullable,
    budget: nullable,
    timeline: nullable,
    location: nullable,
    constraints: strings,
  }),
  interpretation: object({
    intent: { type: 'string', enum: ['PURCHASE', 'RESEARCH', 'SUPPORT', 'UNKNOWN', 'SPAM'] },
    category: nullable,
    summary: string,
    urgency: { type: 'string', enum: ['URGENT', 'NORMAL', 'UNKNOWN'] },
    missing: strings,
    questions: strings,
    warnings: strings,
  }),
});
export class AnalysisError extends Error {
  code: string;
  retryable: boolean;
  constructor(code: string, retryable = false) {
    super(code);
    this.code = code;
    this.retryable = retryable;
  }
}
function validate(value: unknown, schema: Record<string, unknown>): void {
  if (Array.isArray(schema.anyOf)) {
    if (value === null) return;
    validate(value, string);
    return;
  }
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new AnalysisError('INVALID_OUTPUT');
    const props = schema.properties as Record<string, Record<string, unknown>>,
      v = value as Record<string, unknown>;
    if (
      Object.keys(v).length !== Object.keys(props).length ||
      Object.keys(v).some((k) => !(k in props))
    )
      throw new AnalysisError('INVALID_OUTPUT');
    for (const [k, s] of Object.entries(props)) validate(v[k], s);
  } else if (schema.type === 'array') {
    if (!Array.isArray(value) || value.length > Number(schema.maxItems))
      throw new AnalysisError('INVALID_OUTPUT');
    for (const v of value) validate(v, schema.items as Record<string, unknown>);
  } else if (schema.type === 'string') {
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      value.length > 500 ||
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value) ||
      (Array.isArray(schema.enum) && !schema.enum.includes(value))
    )
      throw new AnalysisError('INVALID_OUTPUT');
  } else throw new AnalysisError('INVALID_OUTPUT');
}
export function validateExtraction(value: unknown, source: string): Extraction {
  validate(value, extractionSchema);
  const data = value as Extraction;
  for (const v of Object.values(data.facts).flat())
    if (v !== null && !source.includes(v)) throw new AnalysisError('UNGROUNDED_FACT');
  if (!data.facts.timeline && data.interpretation.urgency !== 'UNKNOWN')
    throw new AnalysisError('UNGROUNDED_URGENCY');
  for (const k of ['requirement', 'quantity', 'budget', 'timeline', 'location'] as const)
    if (data.facts[k] === null && !data.interpretation.missing.includes(k))
      throw new AnalysisError('MISSING_FIELD_NOT_REPORTED');
  return data;
}
export const weights = {
  intent: 30,
  specificity: 25,
  timeline: 20,
  quantity: 10,
  budget: 10,
  location: 5,
} as const;
export const thresholds = { high: 70, medium: 40 };
export function score(data: Extraction) {
  const f = data.facts,
    i = data.interpretation;
  const breakdown = [
    {
      factor: 'Purchase intent',
      points: i.intent === 'PURCHASE' ? weights.intent : i.intent === 'RESEARCH' ? 10 : 0,
      max: weights.intent,
      reason: 'Model interpretation: ' + i.intent,
    },
    {
      factor: 'Requirement specificity',
      points: f.requirement ? weights.specificity : 0,
      max: weights.specificity,
      reason: f.requirement ? 'Customer-stated requirement present' : 'Requirement missing',
    },
    {
      factor: 'Timeline',
      points: f.timeline ? (i.urgency === 'URGENT' ? weights.timeline : 10) : 0,
      max: weights.timeline,
      reason: f.timeline
        ? 'Timeline stated; urgency is a model interpretation'
        : 'Timeline missing',
    },
    {
      factor: 'Quantity clarity',
      points: f.quantity ? weights.quantity : 0,
      max: weights.quantity,
      reason: f.quantity ? 'Quantity stated; magnitude is not estimated' : 'Quantity missing',
    },
    {
      factor: 'Budget clarity',
      points: f.budget ? weights.budget : 0,
      max: weights.budget,
      reason: f.budget ? 'Budget stated; no value inferred' : 'Budget missing',
    },
    {
      factor: 'Location clarity',
      points: f.location ? weights.location : 0,
      max: weights.location,
      reason: f.location ? 'Location stated' : 'Location missing',
    },
  ];
  const value = breakdown.reduce((sum, b) => sum + b.points, 0);
  const label: Priority =
    i.warnings.length || ['UNKNOWN', 'SPAM'].includes(i.intent) || !f.requirement
      ? 'NEEDS_REVIEW'
      : value >= thresholds.high
        ? 'HIGH'
        : value >= thresholds.medium
          ? 'MEDIUM'
          : 'LOW';
  const nextAction =
    label === 'NEEDS_REVIEW'
      ? 'Review the original enquiry and verify the interpretation.'
      : i.missing.length
        ? 'Review the enquiry and request the missing details.'
        : 'Review the requirement and prepare a response.';
  return { value, label, breakdown, nextAction, version: SCORING_VERSION };
}
export type Score = ReturnType<typeof score>;
