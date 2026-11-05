# Growora

Phase 6 adds deterministic routing within each workspace, with member capacity/specialties, durable jobs, simulation and decision history. See [routing architecture and operations](docs/phase6-routing.md), [the implementation report](docs/phase6-completion.md), and the [complete Phases 1–6 testing guide](docs/FINAL_TESTING_GUIDE.md). Live AI remains disabled; routing does not require it.

Phase 5 adds advisory AI lead intelligence, durable processing and human review. See [configuration, scoring, privacy and worker operations](docs/phase5-intelligence.md). AI remains disabled until a server-side provider key, model and approved workspace processing policy are configured.

Phase 4 adds real workspace enquiry forms and lead management. See [the workflow, API, permissions and retention guide](docs/phase4-leads.md). Start at `/dashboard/lead-forms`, share the generated public link, then manage submissions in `/dashboard/leads`.

Growora combines six public marketing pages with a separate email/password account system. Product demos on the marketing site use browser-local sample data. Links to retired workspace and demo destinations return 404.

## Run locally

With Node 24 installed, run `npm ci` and `npm run dev`. When no external auth configuration is present, this starts PostgreSQL on loopback port 55432, applies the migrations and starts Growora at `http://localhost:3000`. Accounts persist across restarts under the git-ignored `.growora-local` directory.

To test, open `/signup` and enter a name, email and password of at least 15 characters. Signup starts a session and opens `/dashboard`. Use the profile menu to return to the website or sign out. Signed-in visits to `/login` and `/signup` open the dashboard. For password recovery, use `/forgot-password`. Local reset messages appear in `.growora-local/inbox`; configured SMTP delivers them to the account email.

To use your own development PostgreSQL and SMTP services instead, configure the values from `.env.example` in `.env.local`, run `npm run db:migrate`, then `npm run dev`. Use the configured public origin when opening the app.

## Production configuration

Deploy behind HTTPS. Set BETTER_AUTH_URL to the public HTTPS origin and generate BETTER_AUTH_SECRET with at least 32 random bytes. Use a private PostgreSQL connection with certificate verification, a migration role for deployment, and a restricted runtime role with DML access to the auth tables. Apply the versioned Drizzle migration before serving requests. Each application process uses up to eight database connections.

Set SMTP_HOST, SMTP_PORT and MAIL_FROM for a verified sender, and SMTP_USER and SMTP_PASSWORD where required. Port 465 uses implicit TLS. Other remote SMTP connections require STARTTLS. The server runtime must support Next.js after-response tasks for mail delivery. Monitor structured delivery errors and configure the ingress to omit cookies, auth payloads and sensitive headers from logs.

Configure AUTH_CLIENT_IP_HEADER only when your ingress overwrites that header with a single verified client IP and blocks direct origin access. Without it, clients share one source quota of 100 requests per ten minutes. Login also allows eight attempts per normalized email per ten minutes. Registration and recovery each allow four. Rate-limit counters are shared across replicas in PostgreSQL.

## Account API

POST JSON to `/api/auth/signup` (name, email, password), `/api/auth/login` (email, password), `/api/auth/logout` (empty object), `/api/auth/forgot` (email), or `/api/auth/reset` (token, password). Writes require the configured Origin. GET `/api/auth/me` returns public profile fields or HTTP 401. All responses disable caching.

Better Auth owns password hashing, verification, cookies and server-side sessions. The HTTP layer restricts the exposed operations and response fields. Reset links expire after 15 minutes and can be consumed once. Resetting a password revokes existing sessions. Email links carry tokens in the URL fragment. The form removes the fragment and submits the token in a request body.

## Account dashboard

Overview displays the signed-in user's profile and registration date. Account settings lets the user edit their display name. Security settings requires the current password to change it and rotates the session, signing out other devices. It also lists active sessions and supports individual or bulk revocation. Better Auth requires a recent login to list sessions.

The private POST endpoints are `/api/account/profile` (name), `/api/account/password` (currentPassword and newPassword), `/api/account/revoke` (session ID) and `/api/account/revoke-others` (empty object). Each uses the existing cookie session and requires the configured Origin. Profile and security pages load their data on the server. Session tokens stay on the server and in HttpOnly cookies.

## Checks

Run `npm test`, `npm run lint`, `npm run build`, and `npm run test:auth`. The integration suite starts the production build, an isolated PostgreSQL cluster, and an SMTP receiver on local ports. It generates disposable credentials and applies the actual migration. Run it as a non-root user on a platform supported by embedded-postgres. Generate future migrations with `npm run db:generate`.

For the optional browser smoke test, start the local development app and run `node tests/dashboard-browser.mjs` with Chrome installed and playwright-core available. Alternatively, set PLAYWRIGHT_MODULE to the installed Playwright module URL and CHROME_PATH to the Chrome executable. This test creates a uniquely named local test account and uses two independent browser sessions.
## Business workspaces

Open `/dashboard/workspace` to create a workspace. UUIDs are generated by PostgreSQL; business names may repeat. Creation inserts the workspace, OWNER membership and audit event in one transaction. The existing dashboard sidebar contains the workspace selector, Team and Workspace Settings. Personal account pages remain accessible without a workspace.

OWNER can edit business details, invite ADMIN or MEMBER, and manage ADMIN or MEMBER memberships. ADMIN can invite and manage MEMBER memberships. MEMBER can view the workspace and team. ADMIN and MEMBER may leave. Ownership transfer and workspace deletion are deferred; the owner cannot leave, be demoted or be removed.

The service checks the current database membership inside every workspace operation. Reads use a shared workspace-row lock and writes use an exclusive lock before checking role and resource ownership. This serializes membership changes with protected operations across application processes. Isolation is enforced by the server data-access layer; PostgreSQL RLS is not enabled. Future workspace-owned queries must use the scoped service boundary. The HttpOnly selected-workspace cookie is a preference only. Invalid or revoked selections fall back to an authorized workspace or onboarding.

The additive `0001_business_workspaces.sql` migration creates workspace, membership, invitation and audit tables, foreign keys, indexes and role enums. Run the existing `npm run db:migrate` on configured databases. Existing auth tables are retained. Back up workspace data before any rollback; reversing this migration removes workspace data and requires dropping dependent tables before the workspace table and enums.

Workspace endpoints use `/api/workspaces/[action]`. GET actions are list, details and team; details/team require an authorized id. POST actions are create, switch, settings, invite, cancel, role, remove, leave, challenge and accept. Mutations require the configured Origin and current session, accept only explicit fields, and apply database-backed account rate limits. Events record actor IDs, resource IDs and operation names without tokens or email addresses.

Invitation emails contain a 256-bit random token whose SHA-256 hash is stored. Invitations expire after seven days. To accept, open the invitation, sign in or create an account with the invited email in another tab, then request the separate eight-digit mailbox confirmation code. The code expires after ten minutes, is stored as an HMAC, and is bound to the invitation and requesting session. Acceptance is transactional and consumes the invitation once. Repeated acceptance cannot create another membership. Revocation, expiry, different accounts and different sessions are rejected. Leaving, removing or demoting an administrator closes their outstanding invitations.

Local development saves invitation and confirmation messages in `.growora-local/inbox`. Configured deployments use the same SMTP provider as password recovery. A successful SMTP response confirms provider acceptance, not final inbox delivery. Delivery failures return an explicit error. If invitation delivery is unconfirmed, revoke the pending invitation and retry. Re-request a confirmation code if its delivery fails.

The production integration test `npm run test:auth` includes `tests/workspaces.integration.mjs` with independent businesses and accounts. Run `node tests/workspaces-browser.mjs` against the local app using the same Playwright setup as the dashboard browser test. Browser tests create uniquely named local test accounts and their workspaces.
