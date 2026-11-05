# Phase 5 completion report

Implementation is complete locally. Live AI is deliberately unavailable because no API key, model, processing-policy reference or approved-workspace allowlist is configured. No customer data was sent to an external AI provider. Manual/user acceptance testing is deferred, as requested. Phase 6 was not started.

## Features and architecture delivered

New enquiries retain the existing atomic capture behavior and add a durable intelligence job in the same database transaction. A separate worker performs provider calls asynchronously. Core capture and human-managed status/assignment remain independent of provider success. Older leads are not automatically backfilled.

The OpenAI adapter requests strict structured output, validates it at runtime, verifies quoted facts against the submitted text, and rejects malformed, incomplete, refused and ungrounded results. Provider integration is isolated and model selection is explicit via environment configuration. The implementation follows [OpenAI's structured-output documentation](https://developers.openai.com/api/docs/guides/structured-outputs); live endpoint/model behavior was not tested.

Extracted information includes requirement, quantity, budget/range, timeline, geography and constraints as customer excerpts; intent, category, summary, urgency, missing details, questions and warnings as AI interpretations. Missing facts remain null. Original lead data is never rewritten.

Versioned deterministic scoring uses purchase intent 30, requirement presence 25, urgency/timeline 20, quantity clarity 10, budget clarity 10 and location clarity 5. RESEARCH intent earns 10; nonurgent stated timeline earns 10. Missing factors earn zero. HIGH starts at 70, MEDIUM at 40, LOW below 40; ambiguity/spam/warnings/missing requirements override to NEEDS_REVIEW. The displayed breakdown explains every factor. This is a heuristic, not a calibrated prediction or financial estimate.

The database worker supports PENDING, PROCESSING, COMPLETED, FAILED and UNAVAILABLE; atomic claims, shared concurrency/daily limits, bounded exponential retries, lease expiry, restart recovery, generation/lease fencing, and atomic result persistence. It cannot restore a deleted lead or overwrite a newer generation/review. Explicit reanalysis preserves prior generations. Human acceptance/flagging and notes are separate from the model output and recorded once per completed version.

The existing list gains an AI priority/status column, priority filtering and score sorting. Lead details gain AI Insights, facts-versus-interpretation labels, score explanation, missing details/questions, provenance, processing state and manager review/reanalysis controls. No redesign, chatbot, messaging, automatic status/assignment change or cross-business routing was added.

## Configuration and operational behavior

See [the complete Phase 5 guide](phase5-intelligence.md) for environment variables, field definitions, scoring, permissions, retention and worker operations.

Defaults: 20-second timeout, 2 concurrent leases, 3 attempts, 2000 output tokens and 100 attempted provider requests per UTC day. Credentials/model/policy/workspace allowlist are required before outbound processing. Per-million token rates are optional; unknown cost stays null. Attempt reservations remain charged after a crash; known successful token usage and optional estimated cost are tracked. Provider charges on invalid/refused/interrupted responses are not fully observable locally.

`npm run dev` now starts the worker for new development sessions. `npm run ai:worker` is the standalone production/supervisor command. A worker is running locally in verified unconfigured mode; it marks eligible jobs UNAVAILABLE without making outbound calls. Production worker supervision, real provider access and operational load testing remain unverified.

Only subject/message are sent, with basic email/international-phone redaction. This is not full anonymization. Workspace authorization requires an operator-reviewed processing-policy reference and UUID allowlist; applicable notice, consent/legal basis, provider terms and retention must be reviewed before enabling. Keys remain server-side. No tools or backend actions are available to the model. `store:false` is set, without claiming regulatory compliance or a zero-retention guarantee.

## Database, API and services

Additive migration `migrations/0003_lead_intelligence.sql` creates `lead_intelligence`, `lead_ai_job` and `lead_ai_usage`, composite tenant/lead foreign keys, unique job generations, cascading lead-data deletion, score/status checks and scheduling/priority indexes. Applied to local PostgreSQL without a reset. Existing users, workspaces, invitations, leads and audit history were preserved.

New endpoints:

- GET `/api/intelligence/detail?workspaceId=…&id=…`
- POST `/api/intelligence/analyze`: workspaceId, id, generation
- POST `/api/intelligence/review`: workspaceId, id, generation, verdict, note

Existing `/api/leads/list` supports priority and sort=priority. OWNER/ADMIN can analyze/review all workspace leads; MEMBER can only read intelligence on assigned leads. All checks are server-side using live membership and tenant/assignment scope. Worker scope comes from persisted composite relationships, never caller-supplied roles.

Services are in `src/server/intelligence/`: contract, config, provider, schema, service and worker. Existing web database pool and workspace authorization are reused. New scripts provide supervised processing and synthetic evaluation.

Security protections include Origin/session checks, mutation quotas, allowlisted/bounded inputs, no-store responses, minimized provider input, fixed provider endpoint, explicit output validation, source-excerpt checks, escaped rendering, timeouts/token/body caps, budget reservation, safe error logging and immutable reviewed generations. AI results and review notes follow lead retention and cascade on explicit deletion; historical results otherwise remain. Aggregate usage contains no customer content.

## Verification results

| Check | Actual final outcome |
| --- | --- |
| TypeScript | Passed |
| Lint | Exit 0; six existing unused-declaration warnings in locked premium-homepage.tsx, no new warnings |
| Production build | Passed |
| Existing domain tests | 9 passed |
| AI unit/provider/worker suite | 25 passed, 0 failed; includes eight real-PostgreSQL worker subtests and a parent test |
| Production HTTP suite | 17 passed, 0 failed; existing account/workspace/lead scenarios plus five AI API subtests |
| Intelligence browser suite | Passed with explicitly labeled synthetic fixture output; no live AI |
| Existing lead browser suite | Passed |
| Existing dashboard browser suite | Passed |
| Existing workspace/team browser suite | Passed |
| Synthetic evaluation | Ten authored fixtures passed schema, fact/missing-field expectation, deterministic score and priority checks |
| Live AI evaluation | Not run: credentials/model/policy absent |
| Migration | Applied locally; disposable database suites also test migrations twice |
| Protected-source audit | No protected file changes; no removed files |
| Manual/user acceptance testing | Deferred; not requested or claimed |

Worker tests cover successful output/usage/version metadata; duplicate concurrent claims; missing policy and later configuration; backoff and permanent/exhausted failures; expired lease recovery and stale-worker fencing; shared concurrency/daily budgets; deletion while processing; transactional result-write failure and recovery. The final UTC accounting refinement was additionally checked with the dedicated worker integration suite.

HTTP tests cover unauthenticated/cross-origin/cross-workspace denial, assignment-level access, member denial of privileged actions, simultaneous manual requests, immutable human reviews, generation history, admin access, revocation, priority filtering and durable ingestion. Existing signup/login/logout/recovery/session/profile/workspace/invitation/lead regressions remain passing.

Browser verification covers missing-configuration display, synthetic insights, review persistence, priority filter and mobile overflow checks, plus existing lead ingestion/status/assignment/history, account/session settings, and workspace/team operations. Screenshots in `test-results/phase5/` clearly identify fixture accounts/model output. Browser fixtures remain isolated in test-created local workspaces.

Initial validation exposed a TypeScript fixture environment-type mismatch, cloned HTTP response-stream cleanup issues, and browser selectors matching hidden Next.js cached routes. These were corrected; final ordinary HTTP and browser runs pass. Two finished-but-stalled disposable test children were stopped after their identities were verified; the local app and database were not interrupted.

## Exact validation and operation commands

```powershell
npm run db:generate -- --name=lead_intelligence
npm run typecheck
npm run lint
npm run build
npm test
npm run test:ai
npm run test:auth
npm run ai:evaluate
node --experimental-strip-types --test tests/intelligence.integration.ts
npm run ai:worker -- --once
npm run ai:worker
node test-results/phase5-audit.cjs
```

Browser commands used on this workstation:

```powershell
$env:PLAYWRIGHT_MODULE='file:///C:/Users/singh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
node tests/intelligence-browser.mjs
node tests/leads-browser.mjs
node tests/dashboard-browser.mjs
node tests/workspaces-browser.mjs
```

The diagnostic HTTP run also passed with `node --import ./test-results/trace-handles.mjs --test tests/auth.integration.mjs`; the final ordinary `npm run test:auth` passed without that diagnostic import.

Formatting used `npx prettier --write` on the new intelligence modules/scripts/tests and the touched lead pages/services. The final worker-only formatting command was `npx prettier --write src/server/intelligence/worker.ts`. No global marketing/auth stylesheet was formatted or modified.

Actual local migration command (reads the existing password privately and never prints it):

```powershell
node --input-type=module -e "import {readFileSync} from 'node:fs';import pg from 'pg';import {drizzle} from 'drizzle-orm/node-postgres';import {migrate} from 'drizzle-orm/node-postgres/migrator';const {password}=JSON.parse(readFileSync('.growora-local/credentials.json'));const c=new pg.Client({host:'127.0.0.1',port:55432,user:'growora_local',password,database:'postgres'});try{await c.connect();await migrate(drizzle(c),{migrationsFolder:'migrations'});console.log('Additive intelligence migration applied locally')}finally{await c.end()}"
```

## Evaluation interpretation

The recorded evaluation mode is MOCKED_FIXTURES_NOT_MODEL_ACCURACY. Fixture processing took approximately 0–1 ms per case; this says nothing about provider latency. Provider token usage and cost are null for the offline evaluation. Synthetic provider-boundary tests exercise usage/cost accounting with invented test numbers only.

The optional explicit live evaluator has a schema/expectation/latency/usage report path and shares database request limits, but its live network path was not executed. No real-model accuracy percentage, production scalability claim or provider billing accuracy is asserted. Lexical exact-match expectations are a small regression dataset, not a statistical benchmark.

## Checkpoint and changed files

Recoverable reference: `refs/checkpoints/growora-before-phase5`

Commit: `416f2557b4ea4469f24deaf9fe1335ad2ec4ee2e`

The checkpoint used a temporary index, preserving the user's existing staged and unstaged work. Hash comparison is against that checkpoint, not the much older HEAD with prior-phase changes.

Created (19, including this report):

- `docs/phase5-intelligence.md`
- `migrations/0003_lead_intelligence.sql`
- `migrations/meta/0003_snapshot.json`
- `scripts/ai-evaluate.ts`
- `scripts/ai-worker.ts`
- `src/app/api/intelligence/[action]/route.ts`
- `src/components/leads/insights.tsx`
- `src/server/intelligence/config.ts`
- `src/server/intelligence/contract.ts`
- `src/server/intelligence/provider.ts`
- `src/server/intelligence/schema.ts`
- `src/server/intelligence/service.ts`
- `src/server/intelligence/worker.ts`
- `tests/fixtures/intelligence-eval.json`
- `tests/intelligence-api.integration.mjs`
- `tests/intelligence-browser.mjs`
- `tests/intelligence.integration.ts`
- `tests/intelligence.test.ts`
- `docs/phase5-completion.md`

Updated (13):

- `.env.example`
- `drizzle.config.ts`
- `migrations/meta/_journal.json`
- `scripts/dev.mjs`
- `src/app/dashboard/leads/[leadId]/page.tsx`
- `src/app/dashboard/leads/page.tsx`
- `src/server/leads/ingestion.ts`
- `src/server/leads/service.ts`
- `tests/auth.integration.mjs`
- `tests/leads-browser.mjs`
- `tests/leads.integration.mjs`
- `README.md`
- `package.json`

Removed: none. Ignored local test screenshots, evaluation/audit JSON and diagnostic helpers are additional verification artifacts.

The six marketing pages, auth interfaces, public enquiry form, existing workspace/account interfaces, shared dashboard CSS and sidebar have no Phase 5 source changes. Only the permitted lead-list/detail extensions were added. No new pixel-baseline comparison is claimed for this phase; preservation is supported by source hashes and relevant browser regressions.

## Remaining limits

- No live provider call, live extraction accuracy, latency, cost, model/account compatibility or provider retention policy was verified.
- API key, model, processing policy and approved workspace IDs are absent locally; external processing therefore stays unavailable.
- Production ingress, worker supervision, backup handling, legal basis and load capacity require deployment-specific verification.
- Redaction is partial; schema/excerpt checks cannot prove semantic correctness. Human oversight remains essential.
- External SMTP delivery remains the prior-phase unverified item and is unrelated to AI processing.
- Comprehensive manual acceptance testing remains intentionally deferred.

No further feature work beyond Phase 5 was performed.
