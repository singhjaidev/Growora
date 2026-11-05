# Phase 6 implementation report

Phase 6 is implemented locally: deterministic, explainable routing within the lead's owning workspace, with safe manual defaults, durable jobs, concurrency protection and dashboard controls. No cross-business marketplace or Phase 7 feature was added. User manual acceptance testing is deferred.

## Feature summary and complete workflow

Customer submits a published enquiry → the existing transaction stores the lead, receipt and activity plus AI work, and schedules routing only if enabled → routing worker loads current workspace policy and eligible members → shared deterministic engine selects a candidate or explains review/skip → assignment, rotation state, decision and activity commit together → dashboard shows source, state, factors and history.

Human assignment/unassignment remains distinct from AUTO_ASSIGNED worker activity. Manual changes invalidate older routing revisions. Existing leads do not silently enter automation when a policy is enabled; a manager deliberately requests routing.

Implemented strategies: MANUAL, persistent ROUND_ROBIN, LEAST_LOADED, exact SKILL matching and configurable HYBRID weighting. Active workload is NEW/CONTACTED/QUALIFIED. Availability, current membership, explicit eligibility and capacity are hard prerequisites. Form-specialty mappings provide deterministic skill input without AI. Optional previously accepted validated AI categories are subordinate to form mappings and never trigger new provider calls.

Full algorithm precedence, scoring formula, API and operational details are in [phase6-routing.md](phase6-routing.md).

## Architecture, data and reliability

New engine/context/service/schema/worker modules reuse the existing auth database pool, workspace permission boundary, lead status rules and PostgreSQL infrastructure. No message broker or general scripting engine.

Additive migration 0004_team_routing.sql creates policy, profile, job and decision tables; adds assignment source/routing revision/state to lead; backfills existing assignments as MANUAL. Composite tenant foreign keys, unique lead/revision jobs, unique job decisions and queue/history/state indexes preserve relational scope. Applied to the existing local database without reset; migration reentrancy also verified in disposable databases.

Workers claim with SKIP LOCKED and random expiring lease tokens. The actual decision takes the same exclusive workspace lock as configuration, membership, status and manual assignment changes, then rechecks token, revision, policy and membership. Assignment/capacity/fairness effects and histories commit atomically. Concurrent workers cannot exceed automatic capacity through a stale count. Failure rolls back effects; retries are bounded and lease expiry supports restart recovery. This is idempotent fenced processing, not a claim of exactly-once execution.

Manual unassignment persists until deliberate reroute. Removed members lose access and assignments move into review; their profile is deleted. Closed leads and existing assignments are not automatically reassigned. Failed job attempts remain observable without falsely recording successful routing.

## Dashboard and security

New /dashboard/settings/routing uses existing Growora components/styles for policy, member profiles, simulation, history and metrics. Team gains a routing-settings link. Leads gain routing filter/source/state, explanations and explicit reroute. Source and human/worker activity labels distinguish the action taken. Metrics include outcomes, task status, attempts, retries, average observed processing duration and strategy distribution.

OWNER/ADMIN can configure/preview/reroute; ADMIN cannot edit another ADMIN/OWNER profile. MEMBER only reads routing history on currently assigned leads. Every service rechecks current membership and tenant/lead ownership. Mutations enforce Origin, session, JSON body limits, field allowlists, revisions and database-backed quotas. Cross-tenant resource substitution is rejected. No customer content is logged by routing. PostgreSQL RLS is not enabled; existing server scoping remains essential.

Preview calls the exact shared evaluator but writes no job, assignment, history or rotation state. A real browser regression uncovered differing timestamp representations between raw pg worker queries and Drizzle preview queries after an assignment. Timestamp normalization fixed it; the HTTP test now explicitly seeds a persisted rotation timestamp, and browser verification exercises preview after automatic assignment and manual unassignment.

## Automated verification executed

| Check | Observed result |
| --- | --- |
| Domain suite | 9 passed |
| AI schema/provider/worker regression | 25 passed, synthetic fixtures only |
| Routing engine/real PostgreSQL suite | 21 passed, including 13 database subtests and parent |
| Production HTTP integration | 23 passed, including six new routing API subtests |
| Dashboard browser | Passed |
| Workspace/team browser | Passed |
| Lead browser | Passed |
| AI Insights browser | Passed with explicitly labeled synthetic data |
| Routing browser | Passed, including console-error and page-error assertions |
| TypeScript | Passed |
| Production build | Passed |
| Lint | Exit 0; only the six existing marketing unused-declaration warnings |
| Source preservation audit | No protected source changes; no removed files |
| User manual testing | Deferred |
| Live AI / external SMTP / deployment load | Not verified |

Routing coverage includes algorithm ties/weights/fallbacks, current/absent/rejected AI category gating, persistent fairness, duplicate claims/events, tenant foreign keys, concurrent capacity, policy/member changes while claimed, manual assignment and unassignment while claimed, lease recovery, exhausted retries, injected precommit failure/rollback, closed/preassigned exclusion, audit effects and safe permanent failure.

HTTP coverage includes authentication, Origin, role hierarchy, tenant/lead/member substitution, mass assignment, optimistic configuration conflicts, nonmutating preview after persisted rotation, explicit reroute, manual revision invalidation, atomic public scheduling/manual default, member revocation and assignment release. All prior account/reset/session/profile/workspace/invitation/lead/AI scenarios remain in the suite.

Browser verification covers policy/profile persistence, actual background assignment, manual override, preview, reroute, capacity review filtering, history and mobile width. New screenshots are test-results/phase6/routing-desktop.png and routing-mobile.png. The mobile screenshot was visually inspected. A Playwright screenshot initially changed input caret styles before hydration; screenshots now preserve caret styles, and the final run has no browser console/page errors.

One ordinary HTTP run completed all assertions but did not exit; that test process was stopped. A fresh run with the existing resource-type diagnostic import completed normally, with 23 passes and exit 0. An earlier ordinary npm run test:auth also completed normally. Intermittent harness shutdown remains an operational test-run caveat; it is not hidden as an application assertion failure or claimed permanently fixed.

## Commands executed

From D:\me\Projects\growora:

```powershell
npm run db:generate -- --name=team_routing
npm run typecheck
npm run lint
npm test
npm run test:ai
npm run test:routing
npm run build
npm run test:auth
node --import ./test-results/trace-handles.mjs --test tests/auth.integration.mjs
npm run routing:worker
node scripts/phase6-audit.mjs
```

The source audit was initially run as node scripts/phase6-audit.cjs before conversion to an ES module to satisfy lint. The initial build attempt before continuation was blocked by automatic approval-review usage limits, then later authorized builds ran and passed. A sandboxed local-worker attempt could not access the database; it was stopped and the authorized local worker started successfully.

Targeted formatting used:

```powershell
npx prettier --write src/server/routing src/components/routing src/app/dashboard/settings/routing scripts/routing-worker.ts tests/routing.test.ts tests/routing.integration.ts tests/routing-api.integration.mjs tests/routing-browser.mjs package.json
```

Browser commands used the existing workstation Playwright installation:

```powershell
$env:PLAYWRIGHT_MODULE='file:///C:/Users/singh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
node tests/dashboard-browser.mjs
node tests/workspaces-browser.mjs
node tests/leads-browser.mjs
node tests/intelligence-browser.mjs
node tests/routing-browser.mjs
```

Local migration used the existing credentials privately, without printing values:

```powershell
node --input-type=module -e "import {readFileSync} from 'node:fs';import pg from 'pg';import {drizzle} from 'drizzle-orm/node-postgres';import {migrate} from 'drizzle-orm/node-postgres/migrator';const {password}=JSON.parse(readFileSync('.growora-local/credentials.json'));const c=new pg.Client({host:'127.0.0.1',port:55432,user:'growora_local',password,database:'postgres'});try{await c.connect();await migrate(drizzle(c),{migrationsFolder:'migrations'})}finally{await c.end()}"
```

Use npm run db:migrate for configured environments, or npm run dev's local migration path. Do not reset a database to apply this phase.

## Checkpoint and file inventory

Checkpoint: refs/checkpoints/growora-before-phase6, commit f476c4a993aff619e92b155755cfc83d5fd6ecca. A temporary Git index preserved existing staged and unstaged work. Comparison uses this phase checkpoint rather than the older repository HEAD.

Created:
- docs/FINAL_TESTING_GUIDE.md
- docs/phase6-routing.md
- docs/phase6-completion.md
- migrations/0004_team_routing.sql
- migrations/meta/0004_snapshot.json
- scripts/phase6-audit.mjs
- scripts/routing-worker.ts
- src/app/api/routing/[action]/route.ts
- src/app/dashboard/settings/routing/page.tsx
- src/app/dashboard/settings/routing/loading.tsx
- src/components/routing/forms.tsx
- src/server/routing/context.ts
- src/server/routing/engine.ts
- src/server/routing/schema.ts
- src/server/routing/service.ts
- src/server/routing/worker.ts
- tests/routing.test.ts
- tests/routing.integration.ts
- tests/routing-api.integration.mjs
- tests/routing-browser.mjs

Modified:
- README.md
- package.json
- drizzle.config.ts
- migrations/meta/_journal.json
- scripts/dev.mjs
- src/app/dashboard/leads/page.tsx
- src/app/dashboard/leads/[leadId]/page.tsx
- src/app/dashboard/team/page.tsx
- src/components/dashboard/shell.tsx
- src/server/leads/schema.ts
- src/server/leads/ingestion.ts
- src/server/leads/service.ts
- tests/auth.integration.mjs

No Phase 6 deletions. Marketing components/pages/assets, authentication pages/components and stylesheets remain byte-identical to the checkpoint. Dashboard changes are additive links/sections/filter data; no design/CSS refactor. Generated test evidence stays git-ignored.

## Limitations and handover

Live AI stays disabled; no real provider execution was verified and no key was requested. Routing works without it. External SMTP delivery remains unverified. Previously observed homepage screenshot differences still require later visual acceptance; source preservation is not a pixel-regression claim.

Routing currently bounds evaluation to 500 members, member editing to 25/page, form choices to the latest 100 and specialty rules to 20. It does not backfill leads or automatically retry review when capacity changes. No late-AI reassignment. Production supervision, throughput/lock contention, backup restoration, deployment configuration and comprehensive accessibility/security review remain future verification tasks. Six existing lint warnings remain unchanged.

The complete [FINAL_TESTING_GUIDE.md](FINAL_TESTING_GUIDE.md) covers all Phases 1–6, actual routes/APIs, setup/environment, 20 later manual walkthroughs with prerequisites/expected results/persistence/limits, safe test data, audit checklist and troubleshooting. No manual testing is requested now. Stop after Phase 6; do not begin Phase 7 without explicit instruction.
