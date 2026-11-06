# Growora final testing guide — Phases 1–7

Prepared for the later user-led review. No manual acceptance testing by the user is claimed or requested during the audit. Phase 7 local verification is complete; see [the audit report](PHASE_7_AUDIT_REPORT.md). This guide describes the implemented application, including limitations; passing local automation is not a production-readiness certification.

## 1. What is implemented

| Phase | Real functionality |
| --- | --- |
| 1 — Accounts | Email/password signup, immediate automatic login without email verification, login/logout, database-backed sessions, password reset, Home navigation from authentication pages. |
| 2 — Dashboard | Protected dashboard, account summary, editable display name, password change with current-password check, session rotation and revocation, responsive navigation. |
| 3 — Workspaces | Business creation and editing, workspace selection, OWNER/ADMIN/MEMBER roles, invitations with mailbox confirmation, cancellation/expiry, membership changes/removal/leave, audit events and server-enforced tenant isolation. |
| 4 — Enquiries | Configurable published enquiry forms, anonymous validated submission and retry protection, persistent leads, scoped counters/search/filter/pagination, manual assignment, status changes, activity history, retention review and explicit deletion. |
| 5 — Intelligence | Durable AI jobs, validated extraction boundary, explainable deterministic priority scoring, worker retries/limits/recovery, AI Insights, priority filtering, human acceptance/flagging, preserved analysis generations. Live provider execution remains disabled. |
| 6 — Routing | Workspace policies, member eligibility/availability/specialties/capacity, five strategies, durable transactional routing, read-only preview, explicit reroute, automatic/manual source labels, review queue, history and aggregate metrics. Works without AI. |

The six marketing pages are separate from actual business data. Their demonstrations use browser-local sample data. Historical links to retired /app and /demo destinations were intentionally left broken at the user's earlier instruction. They are not current dashboard routes.

## 2. Page inventory

Use the configured origin; local default is http://localhost:3000. Bracketed values below must be replaced with IDs obtained from the application, not typed literally.

| Route | Purpose / access |
| --- | --- |
| / | Approved marketing home |
| /product | Approved product marketing |
| /solutions | Approved solutions marketing |
| /integrations | Approved integrations marketing |
| /pricing | Approved pricing marketing |
| /how-it-works | Approved See How It Works page |
| /signup | Register and automatically establish a session |
| /login | Email/password login; signed-in users redirect to dashboard |
| /forgot-password | Request password recovery |
| /reset-password | Open through the recovery email; token arrives in URL fragment |
| /join | Open invitation email; sign in with invited email and confirm mailbox |
| /dashboard | Protected account and selected-workspace overview / real scoped lead counts |
| /dashboard/settings/profile | Personal display name |
| /dashboard/settings/security | Password and session management |
| /dashboard/workspace | Selected workspace overview/onboarding |
| /dashboard/workspace/new | Create another workspace |
| /dashboard/settings/workspace | Authorized business settings |
| /dashboard/team | Team, invitations and role controls |
| /dashboard/lead-forms | OWNER/ADMIN form management |
| /enquiry/[publicFormId] | Anonymous customer enquiry form |
| /dashboard/leads | Workspace lead list, search, status/assignment/priority/routing/retention filters |
| /dashboard/leads/[leadId] | Original enquiry, controls, routing/AI insights and activity |
| /dashboard/settings/routing | OWNER/ADMIN policies, team profiles, simulation, metrics and history |
| /robots.txt, /sitemap.xml | Marketing discovery metadata |
| /opengraph-image, /icon.svg | Site preview/icon assets |

AI Insights and routing history are sections on lead details, not separate invented pages. Invalid/unavailable leads/forms show an unavailable/not-found response. Dashboard error/loading boundaries handle server failures.

### API inventory

Private APIs require the existing session. Mutation requests require the exact configured Origin, JSON and allowlisted fields. Public enquiry ingestion uses its generated public identifier, never a client-selected workspace. Responses disable caching.

| Family | Implemented methods/actions |
| --- | --- |
| /api/auth/[action] | GET me; POST signup, login, logout, forgot, reset |
| /api/account/[action] | POST profile, password, revoke, revoke-others |
| /api/workspaces/[action] | GET list, details, team; POST create, switch, settings, invite, cancel, role, remove, leave, challenge, accept |
| /api/enquiry/[publicFormId] | GET published configuration; POST enquiry with UUID Idempotency-Key header |
| /api/leads/[action] | GET list, detail, stats, forms; POST form-create, form-update, status, assign, delete |
| /api/intelligence/[action] | GET detail; POST analyze, review |
| /api/routing/[action] | GET settings, preview, history; POST policy, profile, reroute |

Workspace details/team GET use id. Lead/intelligence/routing APIs use workspaceId; detail/preview use id for the lead. Lead list supports q, status, assigned, sort, review, priority, routing, page; detail uses activityPage. Routing settings GET supports page for members; history supports optional id and page. Dashboard routing settings use members/history pagination query parameters; lead detail routing pagination uses routingPage.

Policies/profiles/lead mutations require their displayed version. AI mutations use generation. Incorrect/stale versions return 409. Do not invent client role, score or destination fields.

## 3. Setup and commands

From PowerShell in D:\me\Projects\growora, with Node 24 and npm:

```powershell
npm ci
npm run dev
```

With no external database/auth/mail configuration, dev starts persistent loopback PostgreSQL on port 55432, applies migrations and starts Next.js on port 3000. It also starts AI and routing workers. AI stays unavailable without complete approved configuration. Local credentials, database and mail are under git-ignored .growora-local. Never publish this folder or remove it to fix a test.

If using configured services, populate .env.local using .env.example with genuine environment-specific values, then:

```powershell
npm run db:migrate
npm run dev
```

Do not copy placeholder configuration into a working local setup: partial external configuration intentionally fails. Use one server on each port. The dev launcher applies additive migrations automatically only for its built-in local setup; configured deployments must migrate explicitly.

Production-style commands after configuring the environment:

```powershell
npm run db:migrate
npm run build
npm start
# Separate supervised processes:
npm run routing:worker
npm run ai:worker
```

Production must set NODE_ENV=production, real DATABASE_URL and BETTER_AUTH_URL, secrets and mail configuration. Standalone workers load environment files; production routing refuses to fall back to local credentials. npm start alone does not start workers. Avoid creating duplicate ad-hoc workers when npm run dev already supervises them. The job protocol tolerates concurrent workers, but production needs deliberate process supervision.

### Environment names

- Core: DATABASE_URL, BETTER_AUTH_URL, BETTER_AUTH_SECRET.
- Mail: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM.
- Optional trusted ingress: AUTH_CLIENT_IP_HEADER. Only use when ingress replaces the header and blocks direct origin access.
- Local-only mail mode: GROWORA_LOCAL_INBOX (set by local launcher).
- AI gate: AI_ENABLED, OPENAI_API_KEY, AI_MODEL, AI_PROCESSING_POLICY, AI_APPROVED_WORKSPACE_IDS.
- AI limits: AI_TIMEOUT_MS, AI_MAX_OUTPUT_TOKENS, AI_MAX_ATTEMPTS, AI_CONCURRENCY, AI_DAILY_REQUEST_LIMIT.
- Optional AI cost rates: AI_INPUT_USD_PER_MILLION, AI_OUTPUT_USD_PER_MILLION.
- Browser tooling: PLAYWRIGHT_MODULE; most existing suites also support CHROME_PATH.

No API keys are needed for Phase 6. Routing settings are stored per workspace in PostgreSQL, not environment variables. Keep AI_ENABLED=false until a later explicit configuration and policy review.

### Automated validation

```powershell
npm run typecheck
npm run lint
npm test
npm run test:ai
npm run test:routing
npm run build
npm run test:auth
npm run ai:evaluate
node scripts/phase6-audit.mjs
```

The HTTP suite requires the current production build and runs isolated PostgreSQL, SMTP and Next.js on temporary ports. AI/routing worker suites also use disposable PostgreSQL and actual migrations; they never reset the development database. AI tests use synthetic providers/results, not live AI.

With the development app running, Chrome installed, and playwright-core available:

```powershell
$env:PLAYWRIGHT_MODULE='file:///C:/Users/singh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
node tests/dashboard-browser.mjs
node tests/workspaces-browser.mjs
node tests/leads-browser.mjs
node tests/intelligence-browser.mjs
node tests/routing-browser.mjs
```

That module path is specific to this workstation; use the actual installed module URL elsewhere. Routing browser verification uses installed Chrome. Browser suites create uniquely named local fixtures; they do not delete other users' data. Screenshots are under test-results/phase2 through phase6 as generated by individual suites. The phase6 audit requires the local checkpoint reference.

## 4. Safe test dataset for later review

Use unique labels such as FinalReview-YYYYMMDD-random. Create:
- Owner A and workspace A.
- Owner B and workspace B in a separate browser profile.
- An invited ADMIN and MEMBER for workspace A.
- Two published forms in A, one in B.
- Packaging and software specialists in A, with small capacities for controlled testing.
- Synthetic customer names, addresses ending @example.test, invented requirements and no sensitive real data.

Choose passwords privately; never put credentials in reports or screenshots. For external delivery testing use mailboxes you control rather than @example.test. Local inbox files contain reset/invitation secrets: view privately.

Do not reset .growora-local. For a fully isolated environment, use a separate PostgreSQL database and separate app origin/port with its own secret, applying the same migrations. Integration suites already provision isolation automatically. No workspace/account delete UI is implemented; leave test accounts clearly named. Disable disposable forms and use authorized lead deletion only for identified synthetic records.

## 5. Later manual walkthrough

Each item includes route, setup, actions, expected result, persistence verification and limits. Complete this in the later review, not as a requirement to finish Phase 6.

### 1 — Register
- Route: /signup. Setup: signed out, unique synthetic email, private password of at least 15 characters.
- Action: enter name/email/password and submit. Use the Home link once before submission to check navigation.
- Expected: user is created and immediately signed in at /dashboard. No email verification step.
- Verify: reload and open a second tab; session persists. Signed-in /signup and /login redirect to /dashboard.
- Limits: email ownership is not verified at registration; invitation acceptance separately requires mailbox proof.

### 2 — Login and logout
- Route: /login and dashboard profile menu. Setup: registered account.
- Action: sign out, try a wrong password, then correct credentials; sign out again.
- Expected: generic failure for incorrect credentials, dashboard for correct credentials, private pages inaccessible after logout.
- Verify: reload a protected URL after logout. Session cookie is HttpOnly; /api/auth/me returns 401.
- Limits: repeated attempts trigger shared quotas. Do not disable throttles to speed up manual testing.

### 3 — Recover a password
- Routes: /forgot-password → emailed /reset-password fragment link. Setup: registered account and local inbox or configured SMTP.
- Action: request recovery; open the delivered message privately; set a new password, then log in.
- Expected: generic recovery acknowledgement; new password works, old one fails, existing sessions are revoked.
- Verify: reuse the link: it must fail. Check an old browser session loses access.
- Limits: reset link expires after 15 minutes; token is removed from the address fragment by the form. Real SMTP inbox delivery remains unverified.

### 4 — Dashboard protection and navigation
- Route: /dashboard. Setup: compare signed-in and private signed-out browsers.
- Action: open profile menu, Home link, desktop sidebar and narrow mobile navigation.
- Expected: signed-out redirect, authorized account details only, working Home navigation.
- Verify: refresh and browser-back after sign-out; no private data should become usable.
- Limits: navigation is not authorization; API checks are independently tested.

### 5 — Profile and security
- Routes: /dashboard/settings/profile and /dashboard/settings/security. Setup: same account in two independent browser sessions.
- Action: change display name; change password using current password; revoke another session.
- Expected: name persists; password change rotates the current session and revokes others; individual/revoke-others actions deny old sessions.
- Verify: reload profile and attempt private operations in the revoked browser.
- Limits: email changes are not implemented; session listing may require recent login.

### 6 — Create a workspace
- Routes: /dashboard/workspace or /dashboard/workspace/new. Setup: signed-in account.
- Action: create a uniquely named business; open /dashboard/settings/workspace and edit allowed fields.
- Expected: owner membership and workspace persist; current selection changes to the new business.
- Verify: reload, sign out/in and inspect /api/workspaces/list through the authenticated browser.
- Limits: duplicate business names are allowed; UUIDs establish identity. Ownership transfer and workspace deletion are deferred.

### 7 — Switch workspaces
- Route: sidebar selector on /dashboard/workspace. Setup: account belongs to at least two workspaces.
- Action: switch A → B → A.
- Expected: business label, leads, counters, forms and settings follow the selected workspace.
- Verify: refresh the selected page; invalid/revoked selections fall back to an authorized workspace or onboarding.
- Limits: selected-workspace cookie is a preference, never proof of permission.

### 8 — Team invitations
- Routes: /dashboard/team → invitation /join. Setup: owner/admin and a separate invited mailbox/account.
- Action: invite; open mail link; authenticate as the invited email; request mailbox code; enter delivered eight-digit code.
- Expected: membership is created once and invitation consumed. Wrong email, replay, cancelled or expired invitations fail.
- Verify: reload team and switch into the new workspace from the invited account.
- Limits: invitation lasts seven days; code lasts ten minutes and is session-bound. External mail delivery remains unverified. Registration itself still has no verification gate.

### 9 — Role permissions
- Routes: /dashboard/team, /dashboard/settings/workspace, /dashboard/settings/routing. Setup: OWNER, ADMIN, MEMBER.
- Action: inspect each role; owner changes a member role; admin manages a MEMBER; remove a disposable member.
- Expected: OWNER manages nonowners; ADMIN cannot manage another admin/owner; MEMBER cannot configure forms/routing or assign leads. Owner cannot leave/be removed/demoted.
- Verify: repeat blocked operations directly through authenticated API requests; refresh after removal.
- Limits: there is no RLS; live server membership checks and composite database constraints enforce scope.

### 10 — Publish a form
- Route: /dashboard/lead-forms. Setup: OWNER/ADMIN.
- Action: create title, privacy notice, optional review interval and enabled form; copy generated public link.
- Expected: public /enquiry/[publicFormId] opens without login and displays the saved notice.
- Verify: reload manager/public pages; change form version and check stale submissions are rejected.
- Limits: these forms are separate from marketing sample interactions. Review intervals schedule human review, not automatic deletion.

### 11 — Submit a customer enquiry
- Route: generated /enquiry/[publicFormId]. Setup: anonymous browser.
- Action: fill synthetic contact details/subject/message, acknowledge notice, submit.
- Expected: confirmation only after successful storage; no private lead/workspace identifiers returned publicly.
- Verify: owner sees exactly one lead; repeating the same request key/payload does not duplicate it. A fresh submission is a distinct enquiry.
- Limits: reload creates a new client request key. Disabled forms reject submissions; quotas and honeypot checks apply.

### 12 — Manage the lead list
- Route: /dashboard/leads and /dashboard. Setup: several real test submissions.
- Action: search literal text, combine filters, paginate, compare counters.
- Expected: only authorized records; MEMBER sees own assignments; counters reflect stored records.
- Verify: reload with query parameters and compare detail pages.
- Limits: list/history pages are bounded to 20 rows. Large-volume search performance is not benchmarked.

### 13 — Manual assignment
- Route: /dashboard/leads/[leadId]. Setup: manager, current team members and unassigned lead.
- Action: choose member and Save assignment; then deliberately unassign.
- Expected: source is MANUAL and activity records the action. A queued older routing task cannot overwrite it.
- Verify: wait for worker, reload and inspect routing history; unassignment stays until explicit Request routing.
- Limits: human assignments may exceed automatic capacity, intentionally. Only current members of the same workspace are selectable.

### 14 — Status, history and retention
- Route: lead detail. Setup: authorized lead.
- Action: move NEW → CONTACTED → QUALIFIED → CLOSED; reopen CLOSED → NEW where appropriate.
- Expected: valid transitions persist and append activity; reopening does not automatically reroute. Active routing load counts NEW/CONTACTED/QUALIFIED, excluding CLOSED.
- Verify: reload history; try concurrent stale edits in two tabs and expect 409/refresh guidance.
- Limits: retention review is separate. Delete only a clearly identified synthetic lead through Data retention confirmation; its insights/routing/history cascade, while the retry receipt remains.

### 15 — AI Insights and priority
- Route: lead detail AI Insights and /dashboard/leads priority filter. Setup: new lead, worker running, AI unconfigured.
- Action: inspect processing state; optionally request analysis as manager.
- Expected now: UNAVAILABLE/missing configuration is honest; lead capture/manual management/routing still work. No fabricated analysis.
- Verify: /api/intelligence/detail shows actual state; no provider calls should occur while configuration is incomplete.
- Later configured review: with explicit approval, real provider credentials/model and policy, check quoted facts, category interpretation, scoring factors, missing details, review/reanalysis versions and priority filter.
- Limits: current automated insight displays are labeled synthetic fixtures. No live-model accuracy or cost claim. Accepted review is a human action, not model certainty.

### 16 — Routing settings and profiles
- Route: /dashboard/settings/routing (also linked from Team). Setup: OWNER/ADMIN and current members.
- Action: inspect manual default; mark test members eligible and available; set capacity/specialties. Save an enabled strategy.
- Expected: settings persist with incremented versions. Invalid weights (must total 100), capacity outside 1–1000 or foreign form mappings fail.
- Verify: reload; inspect another session and try saving its stale version.
- Limits: profiles default disabled/unavailable; ADMIN edits self or MEMBER profiles, OWNER edits all. Only new submissions are queued when enabled; old leads require explicit rerouting.

### 17 — Automatic assignment and algorithms
- Routes: routing settings → public form → lead detail. Setup: two eligible/available members, capacity sufficient, workers running.
- Action: choose ROUND_ROBIN and submit several leads; then LEAST_LOADED. Configure form specialty and matching member for SKILL. Try HYBRID weights.
- Expected: round robin rotates persisted oldest assignment time; least loaded chooses fewest active assignments; skill chooses matching members; hybrid uses weighted skill and free-capacity fraction.
- Verify: reload assignment source AUTOMATIC, reason/policy version/factors and activity. Restart worker in an isolated test environment and verify persisted state.
- Limits: exact ties resolve deterministically by rotation age then member ID. Hybrid can select a nonspecialist when workload weight dominates, provided at least one eligible specialist exists; no specialist requires configured fallback or review.

### 18 — Preview, history and reroute
- Routes: /dashboard/settings/routing Test Routing Rules, lead detail Routing history.
- Setup: enabled policy and accessible unassigned lead.
- Action: run preview twice, inspect simulation, then explicitly Request routing.
- Expected: previews create no assignment/job/history/rotation change. Requested work runs asynchronously and persists a decision.
- Verify: before/after API/DB read comparison or automated preview regression; refresh detail/history. Assigned/closed/pending leads reject reroute.
- Limits: settings preview selector lists the latest 20 authorized leads; older leads can be previewed from their own detail. To replace an assignment, unassign first.

### 19 — Capacity, review and tenant isolation
- Routes: /dashboard/leads?routing=REVIEW, /dashboard/leads?routing=FAILED, routing settings and APIs.
- Setup: workspace A member capacity 1, workspace B separate owner/data.
- Action: fill A's capacity, submit another enquiry, make members unavailable, remove a member with assigned leads; attempt A credentials with B workspace/lead/member IDs.
- Expected: no forced assignment; review reasons explain capacity/availability/skill gaps. Removal clears assignment into review and immediately revokes access. Foreign resources return unavailable/forbidden.
- Verify: compare both workspace lists/history; MEMBER must not see other members' leads or routing configuration.
- Limits: review does not automatically retry when capacity returns. Deliberate reroute is required. No cross-business transfer exists.

### 20 — Errors and worker reliability
- Routes: enquiry page, dashboard error boundaries, lead detail job state.
- Setup: disposable test data only; developer tools available.
- Action: temporarily block a browser request and retry; attempt malformed fields/stale versions; inspect failed/pending job display.
- Expected: no false confirmation, helpful retry/refresh state, no duplicate assignment and no leaked secrets.
- Verify: run routing integration suite for deterministic concurrency/fault injection; use worker logs and safe database status reads.
- Limits: do not inject failures or kill database services containing real user work. Failed jobs require fixing the cause then authorized reroute; no promise of exactly-once execution.

## 6. Known limitations and remaining review

- Live AI is disabled. Credentials, model, approved workspace policy and allowlist are missing. Synthetic tests validate boundaries, not model accuracy.
- External SMTP acceptance/inbox delivery and real sender configuration remain unverified. Local capture and isolated SMTP tests pass.
- Prior homepage screenshot differences were observed in earlier work. Phase 6 source-hash checks establish no changes to protected marketing/auth/CSS sources; they do not establish pixel identity across browsers, animation timing or fonts. Visual acceptance remains for the later review.
- Six existing unused-declaration lint warnings remain in locked premium-homepage.tsx. Separate Product/Pricing edits add 11 unused-import warnings; final Phase 7 lint has 17 warnings and no errors.
- Phase 7 did not reproduce the historical intermittent shutdown stall in three diagnostic runs. It corrected unread response bodies and teardown ordering; the final expanded HTTP suite passed 30 tests and exited naturally. The historical root cause remains unproved; use the diagnostic below if it recurs.
- Retired marketing destinations remain 404 by earlier instruction.
- Routing evaluates at most 500 current team members, fails safely beyond that, exposes member profiles in pages of 25 and form choices from the latest 100 forms. Up to 20 form-specialty rules and 20 specialties per member are supported.
- Policy/profile edits affect subsequent decisions. No automatic backfill, availability-triggered replay, late-AI reassignment, working-hours scheduling or realtime presence.
- Routing history retains historical selected user IDs, without granting removed users access. Profile deletion removes their rotation state; rejoining creates an ineligible new profile.
- Review/failed routing is visible separately from retention review and AI NEEDS_REVIEW. These are different concepts.
- Workspaces serialize protected mutations and routing decisions for correctness. High-volume throughput, queue latency, lock contention and very large tenant performance are unbenchmarked.
- No automated backup restoration, live deployment, complete screen-reader audit or formal security assessment was performed. User manual acceptance is pending.

## 7. Final audit checklist

- [ ] Authentication: signup/login/logout/reset, password policies, cookie flags over HTTPS, expiry/revocation and generic errors.
- [ ] Authorization: verify every role at both UI and API; removed sessions/members cannot continue privileged operations.
- [ ] Tenant isolation: substitute workspace, lead, form, invitation and member IDs; test assignment-level MEMBER access.
- [ ] Database integrity: migrations applied once/reentrant; composite constraints, optimistic versions, cascading retention and backup recovery.
- [ ] APIs: allowed methods/content types, bounded payloads, unknown fields, Origin checks, quotas, no-store responses and safe errors.
- [ ] UI: navigation, empty/loading/error/success states, persisted edits, filters, pagination and accurate counts.
- [ ] Responsive design: marketing/auth/dashboard/form/routing at mobile, tablet and desktop; zoom and long text.
- [ ] Accessibility: keyboard-only flow, labels, focus, announcements, contrast, screen-reader order and motion preferences.
- [ ] AI correctness: current configuration gate, source-grounded facts, uncertainty, human review, version provenance and later live evaluation.
- [ ] Routing correctness: every strategy/fallback, exact ties, capacity, availability, skills, manual precedence and preview nonmutation.
- [ ] Background reliability: concurrent claims, restart/lease recovery, bounded retry, atomic rollback, stale-worker fencing and operator alerts.
- [ ] Performance: realistic dataset/load, indexes, connection pool budget, lock wait/queue latency and rate-limit behavior.
- [ ] Regression: all automated suites plus agreed visual acceptance for the six approved marketing pages.
- [ ] Environment: secrets excluded, correct origin, verified SMTP, TLS PostgreSQL, trusted ingress header policy, AI disabled until approved.
- [ ] Deployment: migration role versus runtime DML permissions for all tables, supervised web/workers, health checks, backups, recovery rehearsal, observability and rollback plan.

Record actual date, environment, outcome and evidence for each item. Do not mark unchecked items passed from the existence of this document.

## 8. Troubleshooting and safe cleanup

- Start with the dev/web and worker terminal logs. Routing emits routing.worker_started, routing.processed, routing.failed and routing.database_error with safe codes/attempt counts; it does not log enquiry content.
- PENDING routing: check a worker is running against the same database, current job due time and lease. An expired processing lease is recoverable after 60 seconds. Production needs supervised workers.
- REVIEW: inspect reason, member profiles, specialty mapping and active loads. Fix settings and explicitly request routing; do not repeatedly submit the customer form.
- FAILED: INVALID_POLICY/TEAM_LIMIT need configuration correction; PROCESSING_ERROR retries up to three attempts. Inspect database availability/migrations and safely retry through the app after correction.
- Preview 503: verify migration and database access. The Phase 6 timestamp parsing regression is covered by a test after a persisted rotation timestamp.
- Auth 403: use the configured origin consistently (localhost and 127.0.0.1 are not interchangeable). Auth 429: respect the quota window.
- No reset/invitation mail: local mode writes .growora-local/inbox; inspect privately. Configured mode needs valid SMTP/from credentials and provider delivery monitoring.
- Stale version 409: refresh and reconsider current values before saving. Do not force overwrite another user's changes.
- Build/test failures: record the failing command and first error. Rebuild before test:auth. Browser suites need the app, Chrome and correct module URL; routing suite also needs the routing worker. Hidden cached Next routes require visible-page locators.
- Isolated tests provision temporary clusters and clean up on completion. If interrupted, identify the exact test process and its temporary directory before stopping it; never stop/delete a guessed database directory.
- Clean only explicit disposable lead records through the authorized app. Disable test forms and leave labelled test workspaces/accounts. Never run blanket DELETE/TRUNCATE/drop commands or delete .growora-local.
- Checkpoints are recovery evidence, not an instruction to reset the working tree. Preserve later user work and review individual changes before any restoration.

## 9. Phase 7 results and practical retest notes

Local audit completed on 6 November 2026: 90 Node tests passed, zero failed; all five application browser suites and the six-page marketing browser audit passed. Ten AI fixture evaluation cases matched; these are not live-model accuracy measurements. Typecheck and production build passed. Lint has zero errors and 17 documented warnings. See [PHASE_7_AUDIT_REPORT.md](PHASE_7_AUDIT_REPORT.md) for exact evidence, initial failures and limitations.

What changed and what you should see:
- Slow/incomplete JSON requests now receive a safe failure after about ten seconds instead of waiting indefinitely. Ordinary login/signup and enquiry submission still work normally.
- Failed AI HTTP responses release their unread streams. This is a backend resource fix; live AI remains disabled.
- Mobile marketing pages no longer scroll sideways because of the footer.
- Worker logs use routing.outcome_unconfirmed when a failure cannot be durably recorded. Check job/history state before retrying; do not assume the operation failed from a lost database response.
- HTTP tests close response bodies and stop their services in dependency order.
- The vulnerable nested esbuild package is patched. Eight moderate lint-tool dependency nodes remain open; do not run npm audit fix --force against this Next version.

Exact starting URLs:
- http://localhost:3000/ — public home
- http://localhost:3000/signup — create a synthetic test account and automatically sign in
- http://localhost:3000/login — use that account after logout
- http://localhost:3000/forgot-password — request recovery; obtain the generated link privately from local inbox
- http://localhost:3000/dashboard — verify refresh preserves the session
- http://localhost:3000/dashboard/settings/profile — edit and refresh the display name
- http://localhost:3000/dashboard/settings/security — password/session controls
- http://localhost:3000/dashboard/workspace/new — create a labelled test workspace
- http://localhost:3000/dashboard/team — test invited roles using a second account
- http://localhost:3000/dashboard/lead-forms — publish a test form and copy its real enquiry URL
- http://localhost:3000/dashboard/leads — check submitted lead, filters and persisted assignment
- http://localhost:3000/dashboard/settings/routing — configure eligibility/capacity, preview and reroute

Use generated lead/form IDs and email links rather than guessing them. The 20 walkthroughs above provide expected UI/database results, persistence checks and negative cases for all six implemented feature phases. Test with two disposable accounts/workspaces; do not edit another person's records.

After a production build, repeat backend verification:
~~~powershell
npm test
npm run test:ai
npm run test:routing
npm run test:auth
npm run ai:evaluate
~~~

If the HTTP suite stalls after its assertions, keep its output and run:
~~~powershell
node --import ./scripts/test-resources.mjs --test tests/auth.integration.mjs
~~~
The helper writes resource types/stacks under test-results/phase7 after 45 seconds if still running. It does not force an exit. A run that hangs is not a pass merely because assertions printed successfully. Never stop the persistent development database to clean up a disposable test.

Repeat marketing checks with Chrome and Playwright installed:
~~~powershell
$env:PLAYWRIGHT_MODULE='file:///C:/Users/singh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
node tests/marketing-audit.mjs
node scripts/phase7-audit.mjs
~~~
The module URL is this machine's runtime location; on another machine set it to that machine's installed Playwright module. Screenshots/reports are in test-results/phase7/marketing. Current repeated Home screenshots vary by three pixels; other pages are identical across repeated captures. Historical screenshots with different capture settings are not equivalent baselines.

Separate Product/Pricing changes arrived during continuation and were preserved, not authored as Phase 7 work. Their final smoke checks pass, but approved visual acceptance remains pending. Retired /app and /demo links still intentionally return 404. The complete working tree is therefore not claimed identical to the original locked frontend.

Remaining acceptance: personally complete the walkthroughs; check keyboard/screen-reader/mobile behavior and visual approval. Later configured-environment checks must cover real SMTP delivery, approved live AI evaluation, HTTPS cookie behavior, supervision, backups/restoration and realistic load. No production readiness is claimed.

Roadmap: **7/12 phases completed; 5/12 remaining. Next: Phase 8 — Marketing Website & Backend Integration.** Phase 8 has not been started by this audit.
