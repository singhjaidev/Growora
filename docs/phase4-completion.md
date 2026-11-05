# Phase 4 completion report — 5 November 2026

Implemented locally in `D:\me\Projects\growora`. The application remains available at http://localhost:3000. Phase 5 was not started.

## Delivered functionality

Public enquiry forms, anonymous customer submissions, real PostgreSQL lead persistence, workspace-scoped lists and details, search/status/assignment/retention filters, date sorting, 20-row pagination, assignment, validated status transitions, activity history, real overview counters, form enable/disable and confirmed retention deletion are implemented.

The public route is separate from all six locked marketing pages. Existing signup/session/login/password recovery, account settings and workspace architecture are reused.

See [the implementation and manual-testing guide](phase4-leads.md) for the complete endpoint table, role matrix, storage design, status rules, privacy behavior and operational limits.

## How data enters and is protected

An owner/admin creates a form and deliberately publishes its title and privacy notice. The generated public URL contains a random 192-bit identifier. Customers submit without an account. The server derives the destination workspace from that identifier; request-supplied tenant/assignee fields are rejected.

Receipt, lead and initial activity commit in one transaction. A unique form/key receipt protects concurrent retries; a keyed digest rejects reuse with different content. Legitimate requests with new keys are not deduplicated based on their text. Optimistic revisions protect changes to leads/forms. Same-workspace foreign keys and server membership/assignment filters enforce isolation. Removing/leaving members clears assignments and records history atomically.

OWNER/ADMIN manage all workspace enquiries/forms/assignments and may confirm deletion. MEMBER can only view and update permitted statuses on enquiries assigned to them. All checks happen on the server, including direct API requests; there is no RLS.

Validation, bounded bodies, Origin checks, JSON-only writes, honeypot, database-backed quotas, escaped text rendering, no-store responses, explicit DTOs and sanitized error logs are in place. Retention review dates require manual review and explicit deletion. Deletion removes PII/history but retains the receipt digest to prevent retry resurrection. No SMTP delivery is required for ingestion.

## Database and checkpoint

Recoverable pre-Phase-4 Git reference: `refs/checkpoints/growora-before-phase4`.

Checkpoint commit: `701e9f4206a43a7b2fb109ea1148a1042f8d04d3`. It was created with a temporary index so existing staging and work were preserved.

Additive migration `0002_lead_enquiries.sql` creates `lead_form`, `lead`, `lead_activity`, `lead_receipt` and the status enum, indexes, composite foreign keys, unique receipt constraint and retention bounds. It was applied to the existing local PostgreSQL database without resetting users, workspaces or invitations. The integration fixture additionally applies migrations twice to check safe repeat execution.

## Exact verification commands and outcomes

| Command | Final result |
| --- | --- |
| `npm run db:generate -- --name=lead_enquiries` | Generated additive migration and metadata |
| Local Node/Drizzle migration command below | Passed; migration applied to persistent local DB |
| `npx prettier --write src/components/leads src/app/dashboard/leads src/app/dashboard/lead-forms src/app/enquiry src/server/leads src/app/api/leads src/components/dashboard/shell.tsx src/app/dashboard/page.tsx` | Formatted implementation |
| `npx prettier --write tests/leads.integration.mjs tests/leads-browser.mjs tests/auth.integration.mjs src/components/leads/forms.tsx` | Formatted tests/form changes |
| `npx prettier --write src/app/enquiry/error.tsx src/components/leads/leads.module.css tests/leads.integration.mjs tests/leads-browser.mjs` | Formatted final refinements |
| `npm run typecheck` | Passed |
| `npm run lint` | Exit 0; zero errors, six pre-existing unused declarations in locked premium-homepage.tsx |
| `npm test` | 9 passed, 0 failed |
| `npm run build` | Passed; new private/public routes render dynamically |
| `npm run test:auth` | 12 passed, 0 failed; 11 Phase 4 subtests plus enclosing existing account/workspace lifecycle test |
| `node tests/leads-browser.mjs` | Passed in Chrome; anonymous/mobile submission, failure/retry, counters, assignment, status/history, filters, disable |
| `node tests/dashboard-browser.mjs` | Passed; redirects, mobile nav, profile persistence, password rotation, session revocation, logout |
| `node tests/workspaces-browser.mjs` | Passed; onboarding, settings, invitation mailbox confirmation, role updates, switching/removal |
| `node test-results/phase4-visual.cjs before` | Captured current pre-change baseline, 6 marketing pages × 2 widths |
| `node test-results/phase4-visual.cjs after` | Captured same marketing pages/widths against Phase 4 production build |
| `node test-results/phase4-audit.cjs` | Hash-based working-tree inventory and pixel comparison saved |
| `node test-results/phase4-public-inspect.cjs` | Confirmed skip link is offscreen unless focused; apparent screenshot overlap was a full-page capture artifact after scrolling |

Browser commands used this environment variable on this workstation:

```powershell
$env:PLAYWRIGHT_MODULE='file:///C:/Users/singh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
```

Actual persistent-local migration command (password read privately from the existing local credential file):

```powershell
node --input-type=module -e "import {readFileSync} from 'node:fs';import pg from 'pg';import {drizzle} from 'drizzle-orm/node-postgres';import {migrate} from 'drizzle-orm/node-postgres/migrator';const {password}=JSON.parse(readFileSync('.growora-local/credentials.json'));const c=new pg.Client({host:'127.0.0.1',port:55432,user:'growora_local',password,database:'postgres'});try{await c.connect();await migrate(drizzle(c),{migrationsFolder:'migrations'});console.log('Additive lead migration applied locally')}finally{await c.end()}"
```

The initial new test run needed fixture corrections (existing signup returns 200, and browser selectors needed to handle select labels and hidden cached routes). Final runs pass. No failed checks remain unresolved.

## Automated coverage

The 11 Phase 4 integration subtests verify:

1. Owner/admin form permissions, public response allowlist and configuration validation.
2. Required fields, invalid/oversized requests, origin, honeypot and forged destinations.
3. Real persistence, repeated retry handling, legitimate repeated content and consent snapshot.
4. Tenant isolation, unassigned/other-member denial, eligible assignment, direct FK enforcement and admin/member permissions.
5. Concurrent updates, stale revisions, disabled forms and notice-version mismatch.
6. Injected activity-insert failure rolls back both lead and receipt; retry then succeeds.
7. Server pagination, literal wildcard search, filters, date sorting and accurate counters.
8. Member removal clears assignments and immediately denies access.
9. Permanent deletion removes PII/history while retaining receipt protection.
10. Six concurrent first requests create exactly one receipt, lead and activity; self-leave clears assignment and revokes access.
11. Mailbox quota returns 429 and server logs exclude the synthetic customer's contact details/message.

Existing Phase 1–3 HTTP regressions include signup/login/logout, password recovery, sessions, profile/password updates, workspace creation/isolation, invitations, confirmation binding, expiry/replay, role matrix and concurrency. Existing browser suites also passed unchanged.

## Frontend preservation and screenshots

All six marketing routes, their components/styles/assets and authentication page sources have identical hashes to the checkpoint. Existing shared dashboard CSS is unchanged. Only permitted overview data and sidebar items changed.

All 12 screenshots retain the same dimensions. Eleven match pixel-for-pixel. Desktop homepage differs in 47 pixels by a maximum of one color level. The Phase 3 screenshot limitation was not used as a substitute for this fresh baseline; this small current difference is reported explicitly. No changed marketing source or new layout regression was detected.

Artifacts are in `test-results/phase4/`: before/after marketing captures, audit.json, detail-desktop.png, list-mobile.png, public-mobile.png and public-inspect.png. The mobile marketing baseline itself produces 400px-wide captures at a 390px viewport; Phase 4 preserved that existing behavior. New lead/public screens passed the no-document-overflow check at 390px.

## File inventory relative to the checkpoint

Created (24, including this report):

- `docs/phase4-leads.md`
- `migrations/0002_lead_enquiries.sql`
- `migrations/meta/0002_snapshot.json`
- `src/app/api/enquiry/[publicFormId]/route.ts`
- `src/app/api/leads/[action]/route.ts`
- `src/app/dashboard/lead-forms/loading.tsx`
- `src/app/dashboard/lead-forms/page.tsx`
- `src/app/dashboard/leads/[leadId]/page.tsx`
- `src/app/dashboard/leads/loading.tsx`
- `src/app/dashboard/leads/page.tsx`
- `src/app/enquiry/[publicFormId]/not-found.tsx`
- `src/app/enquiry/[publicFormId]/page.tsx`
- `src/app/enquiry/error.tsx`
- `src/components/leads/forms.tsx`
- `src/components/leads/leads.module.css`
- `src/components/leads/summary.tsx`
- `src/lib/lead-policy.ts`
- `src/server/leads/ingestion.ts`
- `src/server/leads/schema.ts`
- `src/server/leads/service.ts`
- `src/server/leads/validation.ts`
- `tests/leads-browser.mjs`
- `tests/leads.integration.mjs`
- `docs/phase4-completion.md`

Updated (8):

- `drizzle.config.ts`
- `migrations/meta/_journal.json`
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/shell.tsx`
- `src/server/auth/http.ts`
- `src/server/workspace/commands.ts`
- `tests/auth.integration.mjs`
- `README.md`

Removed: none. Earlier unrelated dirty/deleted files were preserved. Ignored test artifacts and helper scripts are additional local verification files, not application source.

## Manual acceptance test

1. Open http://localhost:3000/dashboard/workspace and create/select a workspace.
2. Open http://localhost:3000/dashboard/lead-forms, create a form and copy its generated link.
3. Open that http://localhost:3000/enquiry/<publicFormId> link privately; submit an enquiry.
4. Open http://localhost:3000/dashboard and verify the count.
5. Open http://localhost:3000/dashboard/leads and click the customer.
6. Assign a current member, save, update status and verify activity after reloading.
7. Sign in as that MEMBER to verify assigned-only access. Switch workspaces to verify separation.
8. Disable the form to stop new submissions. Review/deletion controls are available to owner/admin.

## Limits and unverified deployment concerns

No Phase 4 functionality is intentionally unfinished. External SMTP inbox delivery remains unverified from the prior phase and is not used by lead ingestion. Production load capacity, deployment ingress configuration, backups, regional data obligations and regulatory compliance have not been certified/tested. Configure a trusted proxy IP header before relying on per-client quotas; otherwise visitors share the source limit. Retention is scheduled human review, not automatic erasure. Test browser accounts remain isolated in the local development database.

No future-phase features were added.
