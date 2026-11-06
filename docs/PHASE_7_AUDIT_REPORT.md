# Phase 7 — Complete system audit

Date: 6 November 2026. Repository: D:\me\Projects\growora.

## Outcome and scope

Phase 7 local audit is complete. Local functionality is verified within the coverage below; manual acceptance, external integration verification and production readiness remain pending. No unresolved critical defect was demonstrated. This is not a security certification or a production scalability claim. Phases 8–12 were not implemented by this audit.

Recovery checkpoint: refs/checkpoints/growora-before-phase7, commit 75dbdd0dcf45aa88268c5ac615008f8c7f719a48. The checkpoint used a temporary index to preserve existing staged work. Existing development data was not reset. Database security/fault tests used disposable PostgreSQL clusters; browser tests used labelled synthetic accounts.

Environment: Windows, Node 24.16, npm 11.13, Next 16.4.4, React 19.3, TypeScript 6. Installed Next route documentation was consulted. Existing routes, config, migrations, environment gates, auth/workspace/lead/AI/routing services, worker entry points and tests were inspected.

## Feature inventory and coverage

| Phase | Intended behavior and evidence |
| --- | --- |
| 1 Authentication | Signup creates a user and session immediately; no email verification. Login/logout, persistent sessions, current-user API, reset expiry/single use/concurrent consumption, revocation, password updates, cookie policy, Origin and quota checks exercised by production HTTP tests. Auth-library bypass rejected. Login/forgot responses avoid direct account disclosure; immediate signup versus duplicate signup still permits registration enumeration. |
| 2 Dashboard/account | Protected navigation, display-name persistence, invalid updates, security settings/password change, refresh and logout exercised in HTTP and dashboard browser tests. No dashboard redesign. |
| 3 Workspaces | Creation, switching, settings, invitations, mailbox binding, expiry/revocation/replay, role hierarchy and membership changes exercised. Direct foreign-ID requests denied. New tests race last-owner demotion/removal/leave and revoke membership while an authorized mutation waits for the workspace lock. |
| 4 Leads | Public DTO/validation, disabled/unknown forms, size/Origin/honeypot/quota restrictions, idempotent simultaneous ingestion, rollback on history failure, real counts/search/sort/filter/pagination, eligible assignments, stale-version rejection, retention deletion and member removal covered. Lead browser tests exercise persisted UI flows. |
| 5 Intelligence | Structured schema, missing/invalid data, deterministic/versioned scores, priority, timeout/provider errors, retries/exhaustion, concurrent claims, stale generations, recovery, usage limits, review/reanalysis and isolation tested with controlled fixtures. Source enquiry stays intact. Human review means immutable ACCEPTED/FLAGGED notes plus reanalysis; there is no editable extracted-fact correction UI. No live provider calls. |
| 6 Routing | Manual, round-robin, least-loaded, skill and hybrid strategies; eligibility/capacity/ties/fallback/review; preview nonmutation; manual precedence; fencing, concurrent processing, transactional rollback and history tested. Works with AI disabled. Lost COMMIT acknowledgement and both real worker CLI once modes added to coverage. |

Security checks targeted object/function authorization, cross-tenant references, mass assignment, unsafe input, resource exhaustion, error disclosure and session boundaries. Application-enforced tenant isolation remains the architecture; PostgreSQL RLS is not enabled. Tests do not establish immunity to all OWASP risks.

## Confirmed defects and corrections

### 1. Unbounded body-read time — medium, API resource handling

Reproduction: send an incomplete chunked JSON body and keep the connection open. The original parser had a byte limit but no elapsed-time limit. A new unit regression failed before the fix because the parser remained pending.

Correction: extracted the shared parser into src/server/auth/body.ts with a 10-second total read deadline, timer cleanup and nonblocking cancellation. Existing byte and object validation remains. All consumers of the shared parser receive the fix.

Regression: tests/body.test.ts covers valid, malformed, oversized and stalled bodies; tests/audit-api.integration.mjs sends a real unfinished HTTP upload. Final HTTP rejection arrived in approximately 10.02 seconds with status 400. This is a body-read bound, not a substitute for production ingress connection limits.

### 2. Unread AI provider error body — medium, resource reliability

Reproduction: return a failed provider response with a readable body and inspect cancellation. The added test failed before the fix.

Root cause: non-OK response handling threw before releasing the unread stream. Correction in src/server/intelligence/provider.ts cancels the body without waiting indefinitely. Regression “failed provider responses release their unread body” passes. Tests use fake transport, not an external provider.

### 3. Mobile document overflow — low, functional frontend defect

Reproduction: all six marketing pages at 390px viewport had 400px document width. Browser inspection traced it to footer grid children retaining their automatic minimum width.

Correction: one scoped min-width: 0 rule for mobile footer grid children in premium-homepage.module.css. No text, font, navigation or visual system was redesigned. Desktop/mobile audit now shows document widths exactly 1440/390. Before-fix evidence remains in test-results/phase7/marketing-before.

### 4. HTTP harness cleanup gaps — medium, test reliability

Inspection found unread fetch response bodies and separately registered teardown hooks that could stop the database before the web client. Three diagnostic baseline runs each passed 23 tests and exited naturally; the historical intermittent stall was NOT reproduced.

Correction: collect suite responses, cancel unread/unlocked bodies, restore fetch, and tear down the app, SMTP, client and cluster in dependency order. Final run cancelled 128 unread bodies, passed 30 tests and exited 0 in 23.88 seconds. No forced success exit was added.

These are verified cleanup gaps, not proof of the historical stall's root cause. scripts/test-resources.mjs provides async-resource stack diagnostics after 45 seconds if a process remains alive; its timer is unreferenced. It records resource types/stacks, not request bodies or secrets. To investigate recurrence, repeat the diagnostic command below and retain any test-results/phase7/handles-*.json output.

### 5. Vulnerable nested esbuild — moderate advisory

Initial audit reported four propagated moderate nodes from esbuild 0.18.20 under @esbuild-kit/core-utils. Narrow override pins that nested dependency to 0.25.12. Stale nested lock entries were regenerated; no broad dependency upgrade was performed. Migration generation still reports 20 tables and no schema changes.

The official advisory concerns the esbuild development server CORS behavior, not a demonstrated Growora Next HTTP exploit: [GHSA-67mh-4wv8-2f99](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99). Final production-dependency audit reports zero vulnerabilities.

Full audit still reports eight moderate propagated lint-tool nodes for [minimatch GHSA-g3hv-75wg-m249](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249). No application API accepts minimatch patterns. Avoid untrusted lint configuration; adopt a compatible upstream fix. npm's suggested eslint-config-next downgrade is not a safe automatic fix for Next 16. This residual development dependency risk remains open.

### 6. Browser regression selector ambiguity — low, test reliability

Workspace and intelligence browser suites initially failed strict selectors because hidden cached Next pages also matched. Scoped those two assertions to main:visible. Both reruns pass; no application rendering behavior was changed.

### 7. False routing failure log after committed operation — low, observability

Fault injection executes COMMIT, then throws to simulate lost acknowledgement. Existing fencing already preserved exactly one assignment/history entry and a completed job, but the catch path logged routing.failed even when it could not record failure.

Correction: only emit routing.failed when the fenced failure update succeeds; otherwise emit routing.outcome_unconfirmed. This does not assume that every uncertain outcome succeeded. The new regression failed on the old log and passes after the fix. All 23 routing tests pass.

## Database, concurrency and reliability

Twenty schema tables and existing migrations were checked; no schema migration/reset was introduced. Integration setup exercises migration application/reapplication. Composite foreign keys reject cross-workspace form, assignee and job references. Explicit deletion cascades owned AI/routing history without deleting a foreign workspace's lead. Member removal clears assignments and revokes future access.

Workspace locks serialize protected mutations against membership changes. Optimistic versions reject stale writes. Durable claims, expired leases, retry limits, transaction rollback and stale-worker fences are exercised by AI/routing suites. Fault injection confirms committed routing effects are not duplicated after lost acknowledgement. Real AI/routing --once processes both exit 0 with their database pools released. Windows once-mode coverage is not proof of graceful POSIX signal handling under deployment load.

## Performance

Final bounded test: 1,000 synthetic leads; 12 sequential paginated HTTP requests; 20 rows per page; accurate count 1,000. Minimum 5.44ms, median 6.50ms, p95/max 68.22ms. EXPLAIN ANALYZE used lead_workspace_id_created_at_id_index with an index-only scan. Evidence: test-results/phase7/performance.json.

No demonstrated query bottleneck justified an index or architecture rewrite. These small local measurements do not validate production concurrency, memory growth, large-tenant pagination, connection budgets, lock contention or queue latency. Workspace serialization is a deliberate correctness constraint.

## Frontend and source preservation

Five application browser suites passed in this phase: dashboard, workspaces, leads, intelligence and routing. New marketing audit checks six pages at desktop/mobile, repeated screenshots, console/page errors, failed requests, links and basic input labels. Final results: no console/page errors, no failed requests, no page overflow, and no unlabelled inputs found by its basic selector.

Stable capture settings: Chrome, 1440x900 and 390x900, DPR 1, en-GB, UTC, light scheme, reduced motion, document.fonts.ready, 1,200ms settle, screenshots with animations disabled. Repeated Home captures differ by only three pixels at each width; the other ten page/viewport combinations are pixel-identical. This demonstrates tiny current rendering variation, not a proven cause for every historical screenshot difference. Full screen-reader/keyboard/contrast acceptance remains pending.

Retired /app and /demo destinations still return 404, including sample dashboard and plan links, as explicitly accepted by the user earlier. They are not repaired in Phase 7; marketing/backend integration belongs to Phase 8.

During continuation, separate Product/Pricing components, their CSS, public/images/hero-bg.png and [slug]/page.tsx wiring appeared in the working tree. They were preserved and included in the final build/marketing smoke checks, but were NOT authored by this audit. Therefore the complete working tree cannot be claimed identical to the approved marketing baseline. Raw CRLF-sensitive diffs exaggerated CSS changes; ignoring line endings shows the audit's footer rule plus a blank-line change. Visual acceptance of the separate Product/Pricing work remains pending.

scripts/phase7-audit.mjs records raw hashes against the checkpoint, including added protected files. It reports protected changes for review; exit 0 means no removed files, not that the design is unchanged.

## Lint warning investigation

Original six warnings in premium-homepage.tsx: unused FlowingRibbon import (36), and unrendered Journey (489), Workspace (726), Integrations (1660), UseCases (1785), FeatureExplorer (2052) declarations. No active JSX callsites were found. These are dormant scaffolding without a demonstrated runtime defect; preserved under the frontend lock, with no rule suppression.

Final lint also reports 11 unused icon imports in the separate incoming pages: Pricing Sparkles/Clock/Users; Product ShieldCheck/Users/GitBranch/BarChart3/Calendar/Inbox/ArrowUpRight/FileText. Left intact with the separate work. Final lint: zero errors, 17 warnings.

## Commands and actual results

Run from the repository in PowerShell. Repeated runs are not counted as additional tests.

| Command | Final result |
| --- | --- |
| npm test | 11 passed, 0 failed |
| npm run test:ai | 26 passed, 0 failed |
| npm run test:routing | 23 passed, 0 failed |
| npm run test:auth | 30 passed, 0 failed; natural exit |
| npm run ai:evaluate | 10 controlled fixtures; all schema/priority/missing/fact/determinism checks match; not model accuracy |
| npm run typecheck | exit 0 |
| npm run lint | exit 0; 17 warnings, 0 errors |
| npm run build | exit 0; 27 static pages generated |
| npm run db:generate -- --name=phase7_integrity_check | 20 tables; no schema changes |
| npm ls esbuild | patched nested 0.25.12; tsx 0.28.2 |
| npm audit --omit=dev --json | zero vulnerabilities |
| npm audit --json | eight moderate development nodes remain |
| node scripts/phase7-audit.mjs | no files removed; protected differences reported |

Node test total: **90 passed, 0 failed** (includes Node parent-test accounting). Fixture evaluation and browser scripts are reported separately.

Browser commands, all executed in this phase:
~~~powershell
$env:PLAYWRIGHT_MODULE='file:///C:/Users/singh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
node tests/dashboard-browser.mjs
node tests/workspaces-browser.mjs
node tests/leads-browser.mjs
node tests/intelligence-browser.mjs
node tests/routing-browser.mjs
node tests/marketing-audit.mjs
~~~
All six scripts passed; marketing covers 12 viewport/page combinations, each captured twice.

Shutdown diagnostic (three baseline runs used the identical helper then located at test-results/phase7-handles.mjs):
~~~powershell
node --import ./scripts/test-resources.mjs --test tests/auth.integration.mjs
~~~

Initial failures were retained in the investigation: stalled parser, provider body cancellation, mobile overflow, ambiguous browser selectors, and incorrect routing failure log. Each relevant regression passed after correction. One final restricted build stopped advancing; its exact build process was stopped, leaving dev/workers untouched. A concurrent retry correctly refused the build lock. The subsequent elevated build completed successfully in approximately nine seconds. These failed attempts are not reported as successful checks.

## Deliverables and boundaries

Application changes: src/server/auth/body.ts and http.ts; intelligence/provider.ts; routing/worker.ts; the mobile footer rule; package.json/package-lock.json override.

Coverage/tooling: tests/body.test.ts, audit-api.integration.mjs, marketing-audit.mjs; auth.integration.mjs, intelligence.test.ts, routing.integration.ts; two visible-page browser selector fixes; scripts/test-resources.mjs and phase7-audit.mjs. Documentation: this report and FINAL_TESTING_GUIDE.md. Generated evidence is in git-ignored test-results/phase7; scripts regenerate it.

Limitations: historical shutdown root cause remains unproved; development minimatch advisory remains; signup enumeration is inherent in the selected immediate-registration behavior; live AI credentials/model/policy/evaluation and external SMTP delivery are unverified; no production deployment, backup restoration rehearsal, large-scale load test or full accessibility certification. No external customer data or real emails were used. User acceptance has not been performed.

Later manual review should follow FINAL_TESTING_GUIDE.md: accounts/reset/session behavior, profile/security persistence, two-workspace role/isolation checks, invitation flow, public enquiry to lead, filters/assignment/history, unavailable AI/review states, routing strategies/capacity/manual precedence, and approved visual acceptance. Production checks remain separate.

**Phases completed: 7/12. Phases remaining: 5/12. Next: Phase 8 — Marketing Website & Backend Integration. Stop after Phase 7.**

