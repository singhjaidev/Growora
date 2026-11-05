# Phase 5 — AI lead intelligence

Phase 5 adds an advisory qualification engine to the existing lead system. It never changes customer content, status, assignee, or contact preferences. It never sends messages, rejects leads, deletes enquiries, or routes them to other businesses. Phase 6 is not included.

Manual acceptance testing is deferred. No user testing or approval is claimed.

## What is implemented

- OpenAI Responses adapter with strict JSON Schema output and independent runtime validation.
- Verbatim customer fact excerpts separated from model interpretations.
- Versioned deterministic 0–100 priority scoring with a visible breakdown.
- PostgreSQL job queue, leased concurrent workers, retries, restart recovery and daily request budget.
- Per-workspace external-processing authorization gate; disabled without credentials and policy.
- Manager-only manual analysis/reanalysis, immutable per-version human review and flagging.
- Lead-list priority/status/score column, priority filtering/sorting, and an additive AI Insights panel.
- Synthetic evaluation dataset, mocked provider tests, PostgreSQL/HTTP tests and automated browser verification.

There is no keyword-based substitute for AI. If the provider cannot be used, the job remains unavailable/pending or fails explicitly. The old marketing demo scoring code is unrelated and remains untouched.

## Extraction and scoring

Schema `extraction-1` returns:

| Group | Fields |
| --- | --- |
| Customer-stated excerpts | requirement, quantity, budget/range, timeline, location, constraints |
| Model interpretations | intent, category, summary, urgency, missing details, clarification questions, warnings |

Fact strings must occur verbatim in the minimized input; absent fields must be null and named in the missing list. Constraints are also source excerpts. This verifies textual grounding, not the semantic truth of an interpretation. Quantity, budget and timeline preserve the customer's wording instead of inventing normalized financial or delivery estimates. Unsupported intents, extra/missing fields, oversized values and invalid output shapes fail validation.

Intent is PURCHASE, RESEARCH, SUPPORT, UNKNOWN or SPAM. Urgency is URGENT, NORMAL or UNKNOWN; missing timeline requires UNKNOWN. The prompt defines urgency as explicitly urgent or within 30 days. This classification is still a model interpretation. No model-confidence percentage is collected or presented as calibrated accuracy.

`priority-1` uses these code-configurable weights:

| Factor | Points |
| --- | --- |
| Intent | PURCHASE 30; RESEARCH 10; other 0 |
| Requirement present | 25, otherwise 0 |
| Timeline | stated and interpreted urgent 20; stated otherwise 10; absent 0 |
| Quantity stated | 10, otherwise 0; magnitude is not used to infer opportunity value |
| Budget stated | 10, otherwise 0; no financial value inferred |
| Location stated | 5, otherwise 0 |

HIGH ≥70; MEDIUM ≥40; LOW <40. NEEDS_REVIEW overrides the label if intent is UNKNOWN/SPAM, a requirement is missing, or warnings exist. The numeric breakdown remains visible. Weights and thresholds live in `src/server/intelligence/contract.ts`; changing their meaning requires a scoring-version change.

The score is an explainable prioritization heuristic, not a conversion probability. The recommended action is deterministic guidance to review/respond/request missing details, never an executed action.

## Processing lifecycle

The existing ingestion transaction now inserts the lead, receipt, initial activity, intelligence pointer and generation-1 job atomically. No provider request occurs in that transaction or in the public request path. An idempotent public retry does not create another job. Existing leads are not backfilled; an owner/admin can explicitly request analysis.

Run the separate worker with `npm run ai:worker`. New local `npm run dev` sessions launch it alongside Next.js. A production deployment must supervise/restart the worker separately using the same database and consistent AI settings. There is no web endpoint that runs arbitrary worker commands and no Redis/Kafka dependency.

States: PENDING, PROCESSING, COMPLETED, FAILED, UNAVAILABLE. Each generation has one unique job. Only the generation referenced by the lead-intelligence row is eligible for work.

A short global advisory scheduling lock coordinates claims, current leased concurrency, and daily reservations across workers. Claims lock the intelligence pointer with SKIP LOCKED, then the job. Provider calls happen outside database transactions. Leases last timeout +30 seconds. Expired leases are reclaimable after restart; every claim increments attempts. A random lease token plus current-generation comparison fences obsolete workers. Results, score and completion state persist transactionally. Deleted leads cannot be recreated by late completions.

Timeout/network/429/5xx failures retry after 10, 20, 40… seconds, capped at 300 seconds and the configured attempt maximum. Invalid schema, unsupported/ungrounded facts, refusal, incomplete output, and permanent provider errors fail without automatic retry. A manager can explicitly create a new generation after failure. Exhausted crash recovery is marked FAILED. Daily-limit jobs wait until the next UTC day. Missing configuration/policy jobs are marked UNAVAILABLE and revisited after 60 seconds.

The public lead never depends on successful AI processing. A failure to insert the durable job is a database-transaction failure, so the public request can safely retry without partial persistence.

## Configuration and processing policy

All configuration is server-only. No model is silently selected and no real key is committed.

| Variable | Meaning/default |
| --- | --- |
| AI_ENABLED | Must be exactly true; disabled by default |
| OPENAI_API_KEY | Server-side provider credential |
| AI_MODEL | Explicit Responses model supporting strict structured outputs |
| AI_PROCESSING_POLICY | Nonempty reference to an operator-reviewed processing policy |
| AI_APPROVED_WORKSPACE_IDS | Comma-separated UUID allowlist; wildcard not accepted |
| AI_TIMEOUT_MS | 20000; allowed 1000–60000 |
| AI_MAX_OUTPUT_TOKENS | 2000; allowed 500–4000 |
| AI_MAX_ATTEMPTS | 3; allowed 1–5 |
| AI_CONCURRENCY | 2; allowed 1–8, coordinated across worker processes |
| AI_DAILY_REQUEST_LIMIT | 100; allowed 1–10000, shared per database/UTC day |
| AI_INPUT_USD_PER_MILLION | Optional verified model-specific input rate |
| AI_OUTPUT_USD_PER_MILLION | Optional verified model-specific output rate |

Before authorizing a workspace, the operator must review the actual notice/consent or other applicable legal basis for its enquiries, including older submissions, provider terms, retention and security arrangements. The policy reference/UUID allowlist is an operational gate, not legal certification. The policy identifier is stored with each attempted job. Restart workers after configuration changes; in-flight requests cannot be recalled.

Only subject/message are sent. Name, email and phone database columns, sessions, passwords, workspace secrets and unrelated leads are excluded. Obvious email addresses and international phone patterns in free text are replaced, but this is not comprehensive anonymization. Names or other personal information can remain in free text, which is why the policy gate is required.

The adapter uses the fixed HTTPS OpenAI Responses endpoint, strict `text.format` JSON Schema, no tools, and `store:false`. Model content is treated as untrusted and cannot call backend actions. The structured-output interface follows the [official OpenAI documentation](https://developers.openai.com/api/docs/guides/structured-outputs). Provider-side data practices still require review; the request option is not a regulatory or retention guarantee.

## Limits, usage and retention

- Maximum source: existing 160-character subject +4000-character message, with a 4161-character provider-input cap.
- Maximum provider response body: 100,000 bytes, plus configured output-token limit.
- Every outbound attempt reserves one daily request before calling the provider, including retries. A crash does not refund the reservation.
- Token totals are recorded when the validated successful response provides usage. Cost is estimated only when both verified per-million rates are configured.
- Failed/refused/invalid outputs, interrupted jobs and lost completions can have provider charges that are not known locally. Requests are conservatively counted; token/cost totals are not billing reconciliation.
- Usage logs contain event/error codes, attempts, latency and usage, not enquiry content or keys.
- Intelligence/jobs/review notes cascade when the parent lead is explicitly deleted. They otherwise follow the lead's retention; no silent deletion or backfill occurs.
- Aggregate daily usage counters contain no customer content and remain retained. Job history retains original validated outputs and separate review notes. The UI shows the five latest versions; older records remain in the database.

## Database

Additive `0003_lead_intelligence.sql` creates:

- `lead_intelligence`: one row per lead, composite tenant/lead uniqueness and foreign key, current generation/status, score/priority, update timestamp, score-range/status checks and tenant/priority/score index.
- `lead_ai_job`: generation uniqueness, composite tenant/lead foreign key, lease/retry scheduling, validated result, model/prompt/schema/scoring versions, processing policy, keyed input digest, usage/timing/cost and separate reviewer metadata. Indexes cover status/available time and lease expiry.
- `lead_ai_usage`: one UTC-day row with conservative request reservations and known successful token totals.

Migration applied locally without resets. Apply `npm run db:migrate` on configured deployments before starting new code. Workers use their own bounded process pool; web requests continue to reuse the existing service pool.

## Authorization and API

Existing session, live workspace membership, tenant scope and MEMBER-assignment checks are reused for every AI API. No RLS is introduced.

| Operation | OWNER / ADMIN | MEMBER |
| --- | --- | --- |
| View AI results | All workspace leads | Assigned leads only |
| Analyze/reanalyze | Yes | No |
| Review/flag a completed version | Yes | No |

GET `/api/intelligence/detail?workspaceId=…&id=…` returns authorized current state and recent versions.

POST `/api/intelligence/analyze` takes workspaceId, id and generation (0 for a never-analyzed existing lead). Stale generations or already-pending/processing work return 409.

POST `/api/intelligence/review` takes workspaceId, id, generation, verdict (ACCEPTED/FLAGGED) and note. Reviews require a completed version and can be recorded once. Reanalysis creates a new version; prior model output/review remains unchanged. Flags do not rewrite the model score or existing lead lifecycle.

Writes require a valid session, configured Origin, JSON, an 8 KiB maximum body, field validation and a 20/account/action/10-minute quota. Responses disable caching. Errors/logs omit customer data and credentials. Existing list API adds `priority` and `sort=priority`; all search/status/assignment/pagination predicates remain server-scoped.

## Evaluation and verification

`tests/fixtures/intelligence-eval.json` contains ten synthetic examples: detailed purchase, vague request, urgent requirement, missing budget, missing timeline, multiple products, ambiguous intent, spam-like content, prompt injection and unusual formatting.

`npm run ai:evaluate` runs authored fixtures through the real validation/scoring boundaries. It checks schema, exact labeled fact/missing-field expectations, priority and deterministic scoring. Its output is explicitly labeled MOCKED_FIXTURES_NOT_MODEL_ACCURACY. Fixture latency is not provider latency, and unknown usage/cost is null.

The optional `npm run ai:evaluate -- --live` uses only these synthetic inputs, requires explicit credentials/model/policy and DATABASE_URL, reserves the shared daily budget, and serializes against worker claims. It refuses to call while workers have live leases. It reports exact-match results, latency and available usage/estimated cost. This path was not run live. Exact excerpt matching is a limited evaluation rubric; it is not an established real-world accuracy measure.

Tests:

- `npm run test:ai`: schema/scoring/provider boundary tests plus disposable PostgreSQL worker tests.
- `npm run test:auth`: existing account/workspace/lead regressions plus AI authorization/reanalysis/review/priority HTTP tests.
- `node tests/intelligence-browser.mjs`: isolated synthetic test account and clearly marked fixture output; no external provider.
- Existing dashboard, workspace and lead browser suites.
- Typecheck, lint, production build and the existing domain tests.

See [the completion report](phase5-completion.md) for actual results, commands and file inventory. No user acceptance testing is requested or claimed.
