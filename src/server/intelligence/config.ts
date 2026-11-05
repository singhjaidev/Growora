export type AIConfig = {
  key: string;
  model: string;
  policy: string;
  workspaces: string[];
  timeoutMs: number;
  maxOutputTokens: number;
  dailyRequests: number;
  concurrency: number;
  maxAttempts: number;
  inputRate: number | null;
  outputRate: number | null;
};
export function configuration(
  env: Record<string, string | undefined> = process.env,
): AIConfig | null {
  const int = (name: string, fallback: number, min: number, max: number) => {
    const v = Number(env[name] ?? fallback);
    if (!Number.isInteger(v) || v < min || v > max)
      throw Error('Invalid AI configuration: ' + name);
    return v;
  };
  const price = (name: string) => {
    if (!env[name]) return null;
    const v = Number(env[name]);
    if (!Number.isFinite(v) || v < 0) throw Error('Invalid AI price');
    return v;
  };
  if (
    env.AI_ENABLED !== 'true' ||
    !env.OPENAI_API_KEY ||
    !env.AI_MODEL ||
    !env.AI_PROCESSING_POLICY?.trim()
  )
    return null;
  const workspaces = (env.AI_APPROVED_WORKSPACE_IDS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (
    !workspaces.length ||
    workspaces.some((s) => !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(s))
  )
    return null;
  return {
    key: env.OPENAI_API_KEY,
    model: env.AI_MODEL,
    policy: env.AI_PROCESSING_POLICY.slice(0, 200),
    workspaces,
    timeoutMs: int('AI_TIMEOUT_MS', 20000, 1000, 60000),
    maxOutputTokens: int('AI_MAX_OUTPUT_TOKENS', 2000, 500, 4000),
    dailyRequests: int('AI_DAILY_REQUEST_LIMIT', 100, 1, 10000),
    concurrency: int('AI_CONCURRENCY', 2, 1, 8),
    maxAttempts: int('AI_MAX_ATTEMPTS', 3, 1, 5),
    inputRate: price('AI_INPUT_USD_PER_MILLION'),
    outputRate: price('AI_OUTPUT_USD_PER_MILLION'),
  };
}
export function available(workspaceId: string) {
  try {
    return configuration()?.workspaces.includes(workspaceId) ?? false;
  } catch {
    return false;
  }
}
