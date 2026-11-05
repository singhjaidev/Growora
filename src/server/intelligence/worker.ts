import { randomUUID, createHmac } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import {
  AnalysisError,
  score,
  PROMPT_VERSION,
  SCHEMA_VERSION,
  SCORING_VERSION,
  validateExtraction,
} from './contract.ts';
import type { AIConfig } from './config.ts';
import { openAIProvider, minimize, type Provider } from './provider.ts';
async function transaction<T>(pool: Pool, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const result = await fn(c);
    await c.query('COMMIT');
    return result;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}
type Claim = {
  id: string;
  workspace_id: string;
  lead_id: string;
  generation: number;
  attempts: number;
  lease_token: string;
  input: string;
  usageDay: string;
};
export async function runOnce(
  pool: Pool,
  config: AIConfig | null,
  provider: Provider = openAIProvider(),
  hashSecret = process.env.BETTER_AUTH_SECRET ?? '',
): Promise<boolean> {
  const claim = await transaction(pool, async (c) => {
    // One brief global scheduling lock enforces the shared concurrency and daily request budget.
    await c.query('SELECT pg_advisory_xact_lock(58419305)');
    const active = await c.query(
      "SELECT count(*)::int n FROM lead_ai_job WHERE status='PROCESSING' AND lease_until>now()",
    );
    if (active.rows[0].n >= (config?.concurrency ?? 1)) return null;
    const candidate =
      await c.query(`SELECT i.lead_id,i.workspace_id,i.generation FROM lead_intelligence i JOIN lead_ai_job j ON j.lead_id=i.lead_id AND j.workspace_id=i.workspace_id AND j.generation=i.generation
   WHERE (j.status IN ('PENDING','UNAVAILABLE') AND j.available_at<=now()) OR (j.status='PROCESSING' AND j.lease_until<=now())
   ORDER BY j.available_at,j.id FOR UPDATE OF i SKIP LOCKED LIMIT 1`);
    if (!candidate.rowCount) return null;
    const i = candidate.rows[0],
      job = (
        await c.query(
          'SELECT * FROM lead_ai_job WHERE lead_id=$1 AND workspace_id=$2 AND generation=$3 FOR UPDATE',
          [i.lead_id, i.workspace_id, i.generation],
        )
      ).rows[0];
    if (!config || !config.workspaces.includes(i.workspace_id) || !hashSecret) {
      await c.query(
        "UPDATE lead_ai_job SET status='UNAVAILABLE',error_code='CONFIGURATION_REQUIRED',lease_token=null,lease_until=null,available_at=now()+interval '60 seconds' WHERE id=$1",
        [job.id],
      );
      await c.query(
        "UPDATE lead_intelligence SET status='UNAVAILABLE',updated_at=now() WHERE lead_id=$1 AND workspace_id=$2",
        [i.lead_id, i.workspace_id],
      );
      return { idle: true };
    }
    if (job.attempts >= config.maxAttempts) {
      await c.query(
        "UPDATE lead_ai_job SET status='FAILED',error_code='RETRY_EXHAUSTED',lease_token=null,lease_until=null WHERE id=$1",
        [job.id],
      );
      await c.query(
        "UPDATE lead_intelligence SET status='FAILED',updated_at=now() WHERE lead_id=$1 AND workspace_id=$2",
        [i.lead_id, i.workspace_id],
      );
      return { idle: true };
    }
    await c.query(
      "INSERT INTO lead_ai_usage(day) VALUES((now() AT TIME ZONE 'UTC')::date) ON CONFLICT DO NOTHING",
    );
    const budget = await c.query(
      "UPDATE lead_ai_usage SET requests=requests+1 WHERE day=(now() AT TIME ZONE 'UTC')::date AND requests<$1 RETURNING day",
      [config.dailyRequests],
    );
    if (!budget.rowCount) {
      await c.query(
        "UPDATE lead_ai_job SET status='PENDING',error_code='DAILY_LIMIT',lease_token=null,lease_until=null,available_at=date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'+interval '1 day' WHERE id=$1",
        [job.id],
      );
      await c.query(
        "UPDATE lead_intelligence SET status='PENDING',updated_at=now() WHERE lead_id=$1 AND workspace_id=$2",
        [i.lead_id, i.workspace_id],
      );
      return { idle: true };
    }
    const record = (
      await c.query('SELECT subject,message FROM lead WHERE id=$1 AND workspace_id=$2', [
        i.lead_id,
        i.workspace_id,
      ])
    ).rows[0];
    const input = minimize(record.subject, record.message),
      token = randomUUID();
    await c.query(
      `UPDATE lead_ai_job SET status='PROCESSING',attempts=attempts+1,lease_token=$2,lease_until=now()+($3 * interval '1 millisecond'),error_code=null,model=$4,policy=$5,prompt_version=$6,schema_version=$7,scoring_version=$8,input_hash=$9 WHERE id=$1`,
      [
        job.id,
        token,
        config.timeoutMs + 30000,
        config.model,
        config.policy,
        PROMPT_VERSION,
        SCHEMA_VERSION,
        SCORING_VERSION,
        createHmac('sha256', hashSecret).update(input).digest('hex'),
      ],
    );
    await c.query(
      "UPDATE lead_intelligence SET status='PROCESSING',updated_at=now() WHERE lead_id=$1 AND workspace_id=$2",
      [i.lead_id, i.workspace_id],
    );
    return {
      ...job,
      attempts: job.attempts + 1,
      lease_token: token,
      input,
      usageDay: budget.rows[0].day,
    } as Claim;
  });
  if (!claim) return false;
  if ('idle' in claim) return true;
  const cfg = config!;
  let result: Awaited<ReturnType<Provider>> | undefined, error: AnalysisError | undefined;
  try {
    result = await provider(claim.input, cfg);
    validateExtraction(result.data, claim.input);
  } catch (e) {
    error = e instanceof AnalysisError ? e : new AnalysisError('PROVIDER_FAILURE', true);
  }
  await transaction(pool, async (c) => {
    const current = await c.query(
      'SELECT generation FROM lead_intelligence WHERE lead_id=$1 AND workspace_id=$2 FOR UPDATE',
      [claim.lead_id, claim.workspace_id],
    );
    // A deleted record, replaced generation, lost lease or reviewed job can never be overwritten.
    if (!current.rowCount || current.rows[0].generation !== claim.generation) return;
    const guarded = await c.query(
      "SELECT id FROM lead_ai_job WHERE id=$1 AND workspace_id=$2 AND lease_token=$3 AND status='PROCESSING' AND reviewed_at IS NULL FOR UPDATE",
      [claim.id, claim.workspace_id, claim.lease_token],
    );
    if (!guarded.rowCount) return;
    if (error) {
      const retry = error.retryable && claim.attempts < cfg.maxAttempts;
      await c.query(
        "UPDATE lead_ai_job SET status=$2,error_code=$3,lease_token=null,lease_until=null,available_at=now()+($4 * interval '1 second') WHERE id=$1",
        [
          claim.id,
          retry ? 'PENDING' : 'FAILED',
          error.code,
          Math.min(300, 10 * 2 ** (claim.attempts - 1)),
        ],
      );
      await c.query(
        'UPDATE lead_intelligence SET status=$2,updated_at=now() WHERE lead_id=$1 AND workspace_id=$3',
        [claim.lead_id, retry ? 'PENDING' : 'FAILED', claim.workspace_id],
      );
      console.info(
        JSON.stringify({ event: 'ai.attempt', code: error.code, attempt: claim.attempts, retry }),
      );
    } else if (result) {
      const scoring = score(result.data),
        cost =
          result.inputTokens !== null &&
          result.outputTokens !== null &&
          cfg.inputRate !== null &&
          cfg.outputRate !== null
            ? String(
                (result.inputTokens * cfg.inputRate + result.outputTokens * cfg.outputRate) /
                  1000000,
              )
            : null;
      await c.query(
        `UPDATE lead_ai_job SET status='COMPLETED',result=$2,model=$3,input_tokens=$4,output_tokens=$5,latency_ms=$6,cost_usd=$7,processed_at=now(),lease_token=null,lease_until=null WHERE id=$1`,
        [
          claim.id,
          JSON.stringify({ extraction: result.data, scoring }),
          result.model,
          result.inputTokens,
          result.outputTokens,
          result.latencyMs,
          cost,
        ],
      );
      await c.query(
        "UPDATE lead_intelligence SET status='COMPLETED',score=$2,priority=$3,updated_at=now() WHERE lead_id=$1 AND workspace_id=$4",
        [claim.lead_id, scoring.value, scoring.label, claim.workspace_id],
      );
      await c.query(
        'UPDATE lead_ai_usage SET input_tokens=input_tokens+$1,output_tokens=output_tokens+$2 WHERE day=$3',
        [result.inputTokens ?? 0, result.outputTokens ?? 0, claim.usageDay],
      );
      console.info(
        JSON.stringify({
          event: 'ai.completed',
          attempt: claim.attempts,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          latencyMs: result.latencyMs,
          costUsd: cost,
        }),
      );
    }
  });
  return true;
}
