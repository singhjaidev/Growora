# Phase 4: lead enquiries

Phase 4 adds public enquiry forms and private lead management to the existing account and workspace system. It does not connect the six marketing pages' demo forms to business data. No email delivery, AI, billing, or sales automation is part of ingestion.

## Try the workflow locally

Start with `npm run dev`. The local application is at http://localhost:3000.

1. Sign up at http://localhost:3000/signup or sign in at http://localhost:3000/login. Signup immediately creates a session; email verification is not required.
2. Create or select a workspace at http://localhost:3000/dashboard/workspace.
3. Open http://localhost:3000/dashboard/lead-forms. Create a form with a public title, privacy notice, optional review interval and “Accept submissions” enabled.
4. Click **Copy link**, then open that generated http://localhost:3000/enquiry/<publicFormId> link in a private window. Customers do not sign in.
5. Enter customer details, subject and message, acknowledge the notice, and submit. “Enquiry received” appears only after the database transaction succeeds.
6. Open http://localhost:3000/dashboard to see the actual workspace counts, then http://localhost:3000/dashboard/leads. Search/filter or open the customer name.
7. Under **Manage enquiry**, assign a current workspace member and save. Add team members through the existing http://localhost:3000/dashboard/team invitation workflow if needed. An owner/admin may assign themselves.
8. Update the status, reload and check **Activity history**. An ordinary member sees and can update only leads currently assigned to them.
9. Disable the public form and reopen its link: it becomes unavailable. Existing enquiries remain.
10. For retention, filter leads by **Review due**. An owner/admin can open **Data retention → Delete enquiry** and confirm permanent deletion.

Browser tests create isolated, clearly named test accounts/workspaces in the local development database. They do not alter existing user workspaces. HTTP integration tests use a separate disposable database.

## Permissions and isolation

| Capability | OWNER | ADMIN | MEMBER |
| --- | --- | --- | --- |
| View enquiries and counters | All in workspace | All in workspace | Assigned to self only |
| Update status/history access | All in workspace | All in workspace | Assigned to self only |
| Create/edit/enable forms | Yes | Yes | No |
| Assign/reassign | Yes | Yes | No |
| Confirm permanent deletion | Yes | Yes | No |

Every private operation checks the existing session and current database membership. Queries require the workspace ID and apply the same workspace constraint to records. MEMBER queries also require the actor to be the assignee. The selected-workspace cookie is a preference, never authorization. Database foreign keys prevent cross-workspace forms, activity and assignments.

The existing workspace lock is acquired before membership checks. Reads/ingestion share-lock; mutations exclusively lock. This coordinates role changes, removal, ingestion, assignment and form disabling across processes. Removing a member or leaving a workspace clears their assignments, increments affected revisions and records activity in the same transaction. There is no PostgreSQL RLS; server scoping remains the isolation boundary.

Status rules are centralized in `src/lib/lead-policy.ts`: NEW → CONTACTED/QUALIFIED/CLOSED; CONTACTED → QUALIFIED/CLOSED; QUALIFIED → CONTACTED/CLOSED; CLOSED → NEW. Repeating the current status is a no-op. Form and lead revisions reject stale edits with HTTP 409 rather than overwriting a concurrent change.

## Storage and migration

Additive migration `migrations/0002_lead_enquiries.sql` creates:

- `lead_form`: workspace owner, random 192-bit public identifier, title, privacy notice, enabled state, optional 1–3650 day review interval, revision and timestamps.
- `lead`: workspace/form references, customer name/email/optional phone, subject/message, consent notice snapshot, status, nullable assignee, review date, revision and timestamps.
- `lead_activity`: tenant/lead reference, actor reference, action, previous/next status or assignee IDs and timestamp. No message or contact details in change metadata.
- `lead_receipt`: unique (form ID, UUID request key), keyed payload digest and timestamp. This protects retries without storing a second copy of contact details.

Composite foreign keys bind a lead to a form in the same workspace, an assignment to that workspace's membership, and activity to a lead in that workspace. Source forms/workspaces with leads are restricted from deletion. Removing a lead cascades its activity. Nullable actor references are set null if their account is deleted.

Indexes support workspace/date pagination, status, assignment, source form, retention review and paginated history. Lists and history return at most 20 rows per page. Overview returns counts and five recent records. Search uses parameterized, escaped substring matching; large-scale search performance has not been benchmarked.

The migration has been applied to the persistent local development database without resets. Existing users, workspaces and invitations are retained. Configured deployments must apply `npm run db:migrate` before serving the new code and grant the runtime role DML access to the new tables. Do not reverse/drop these tables without a backup and explicit data-retention decision.

## Reliable ingestion and privacy

POST requests use a client-generated UUID `Idempotency-Key`. The client retains the same key while retrying the same payload in the mounted form. The server normalizes/validates input, resolves the workspace exclusively from the published identifier, and atomically inserts the receipt, NEW lead and RECEIVED activity. Concurrent claims use a database unique key; the losing request verifies the committed digest. A reused key with changed data returns 409. Similar content with a new key remains a legitimate new enquiry.

Receipt lookup precedes the current form-version check for previously accepted submissions. New submissions require the privacy-notice version that the customer viewed. Disabled forms reject even old retries. Reloading the browser discards its in-memory submission key; a new submission after reload is a separate request.

Review dates schedule human review, not automatic deletion. Form interval changes affect future submissions. Confirmed deletion removes the lead's personal details and history but retains the receipt's UUID and HMAC digest, preventing old retries from recreating deleted data. Receipts are retained indefinitely in this phase; they contain derived identifiers, not raw contact/message fields. Backup retention remains an operator responsibility.

Public responses expose only published form configuration or generic success/error data, never a lead ID or private workspace/member data. Private responses use explicit DTOs and no-store headers. React renders messages as escaped text. No raw HTML insertion or customer PII logging is used.

Writes require the configured Origin and JSON. Public bodies are capped at 24 KiB; private lead writes at 8 KiB. Fields have independent size/type checks, an allowlist, Unicode normalization, control-character checks and required privacy acknowledgement. A hidden honeypot rejects filled bot fields.

Database-backed quotas use ten-minute windows: public source 120, per form 100, per form/email 8; private form creation 20/account, other lead mutations 60/account per action. Retries also consume quota. Set `AUTH_CLIENT_IP_HEADER` only behind ingress that overwrites it with one verified IP and blocks direct origin access. Without this, source quota is deliberately shared across visitors. Quotas are basic abuse controls, not a full distributed denial-of-service defense.

## Endpoints and routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | /api/enquiry/[publicFormId] | Enabled public configuration only |
| POST | /api/enquiry/[publicFormId] | Anonymous validated/idempotent submission |
| GET | /api/leads/list?workspaceId=… | q, status, assigned, sort, review, page |
| GET | /api/leads/detail?workspaceId=…&id=… | Detail and activityPage |
| GET | /api/leads/stats?workspaceId=… | Authorized counts and recent enquiries |
| GET | /api/leads/forms?workspaceId=… | Manager-only forms/submission totals |
| POST | /api/leads/form-create | workspaceId and form configuration |
| POST | /api/leads/form-update | workspaceId, id, version and configuration |
| POST | /api/leads/status | workspaceId, id, version, status |
| POST | /api/leads/assign | workspaceId, id, version, assignee (or null) |
| POST | /api/leads/delete | workspaceId, id, version |

New screens: `/enquiry/[publicFormId]`, `/dashboard/lead-forms`, `/dashboard/leads`, `/dashboard/leads/[leadId]`. Existing dashboard overview gains real scoped lead counters. The existing sidebar gains Leads and manager-only Enquiry forms.

Services live in `src/server/leads/{schema,validation,ingestion,service}.ts`; centralized policy lives in `src/lib/lead-policy.ts`. Existing auth service/database pool and workspace authorization are reused.

## Verification

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, then `npm run test:auth`. The HTTP suite includes the existing auth/account/workspace tests and dedicated Phase 4 subtests in `tests/leads.integration.mjs`.

With the local app running and Chrome plus Playwright available, run:

```powershell
$env:PLAYWRIGHT_MODULE='file:///C:/Users/singh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
node tests/leads-browser.mjs
node tests/dashboard-browser.mjs
node tests/workspaces-browser.mjs
```

This Playwright path is specific to the current workstation; install/use another playwright-core path on other machines. CHROME_PATH may override the browser executable.

No claim is made about external SMTP delivery, deployment security certification, regulatory compliance or production load capacity. Enquiry ingestion does not send mail. Existing invitation/reset mail delivery remains a separate concern. Phase 5 has not been implemented.
