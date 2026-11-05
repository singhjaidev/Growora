# Phase 6 — internal team routing

Customer enquiry → atomic lead/receipt/activity/AI-job storage → optional durable routing job → current workspace policy and member evaluation → transactional assignment/decision/activity → dashboard source, reason and history.

AI intelligence and routing are independent. Customer data is never sent to a provider by routing. A human's manual assignment/unassignment takes precedence over older jobs. A worker action is labeled AUTOMATIC/AUTO_ASSIGNED, with a null human actor displayed as Routing worker.

## Policy and strategy precedence

Existing workspaces default to disabled MANUAL. A manager must explicitly enable another strategy, and explicitly make profiles eligible and available.

1. CLOSED leads are skipped; any existing assignment is preserved.
2. Disabled/MANUAL policy skips automatic assignment.
3. Candidates must be current members of the owning workspace with eligible=true, available=true and active load below capacity.
4. Category comes first from a manager-configured source-form specialty.
5. Only when explicitly enabled and no form specialty exists, an accepted current completed AI generation with extraction-1 schema may supply a category. Stored extraction is revalidated against minimized original text; warnings, SPAM/UNKNOWN intent, invalid or older generations are excluded.
6. Apply strategy; missing category/skill for SKILL/HYBRID goes to REVIEW unless the manager explicitly chose LEAST_LOADED fallback.
7. Persist the outcome, policy version, algorithm version, factors, exclusion counts and reason. Insufficient candidates remain unassigned.

| Strategy | Selection |
| --- | --- |
| MANUAL | No automated assignment |
| ROUND_ROBIN | Oldest lastAssignedAt; never-assigned first; member ID breaks exact ties |
| LEAST_LOADED | Fewest active assignments, then rotation age, then member ID |
| SKILL | Exact normalized specialty match, then fewest active assignments, rotation age and ID |
| HYBRID | Highest skillWeight × exact-match + loadWeight × (1 − active/capacity), then active load, rotation age and ID |

Weights are nonnegative integers totaling 100. Scores round to two decimals and are algorithmic suitability, not Phase 5 lead priority. Availability/capacity are hard exclusions, not soft score factors. If a specialist exists, a large workload weight can select a nonspecialist under HYBRID; if no specialist exists, explicit fallback/review applies. Non-hybrid strategies do not use the weighted score for selection.

Workload includes NEW, CONTACTED, QUALIFIED. CLOSED is excluded. Manual assignments count toward load but are not restricted by automatic capacity. Settings permit 1–1000 capacity, 20 specialties/member and 20 form-specialty rules. Names normalize to lowercase NFC. No arbitrary scripts, SQL or invented classifications.

## Backend, database and concurrency

Modules in src/server/routing:
- engine.ts: shared pure deterministic evaluation and policy/specialty validation.
- context.ts: tenant-bound lead/policy/member/load queries and optional validated stored-AI lookup.
- service.ts: role-checked configuration, preview, reroute, history and metrics.
- schema.ts: additive Drizzle definitions.
- worker.ts: durable claims, fencing, transaction-safe decisions and retries.

Migration 0004_team_routing.sql adds routing_policy, member_routing_profile, routing_job and routing_decision; lead gains assignment_origin, routing_revision and routing_state. Existing assignments are backfilled as MANUAL without queueing historical leads. Composite foreign keys bind profiles to memberships and jobs/decisions to tenant-owned leads. Unique lead/revision jobs and unique job decisions prevent duplicate durable effects. Indexes support queue claims, expired leases, tenant history and routing-state filtering. Historical decision user IDs intentionally remain after membership removal; they are not access grants.

Ingestion creates a job in the same transaction as the lead only when the current workspace policy is enabled and nonmanual. The existing shared workspace lock coordinates ingestion with configuration changes. Database failure rolls back capture and scheduling together.

Workers claim due PENDING or expired PROCESSING jobs with FOR UPDATE SKIP LOCKED, random lease token and a 60-second lease. The claim transaction commits before acquiring the workspace lock. A separate decision transaction takes workspace FOR UPDATE, then rechecks the job's token/status and reloads current policy, membership, capacity and lead state. Manual changes, membership changes and configuration writes use that same workspace lock. Different workers cannot simultaneously consume the same member capacity within a workspace.

The assignment, lead version, profile rotation timestamp, AUTO_ASSIGNED activity, structured routing decision, audit event and job completion commit together. Failed transactions leave no false assignment, activity or fairness update. Job claims may repeat; effects are idempotent and fenced, not exactly-once execution.

Manual assignment and unassignment increment routing_revision even when confirming the same choice. Older jobs record SUPERSEDED_MANUAL_OR_REROUTE without touching current state. Member removal clears assignments into REVIEW, increments revision and deletes the profile via membership cascade. Reroute requires OWNER/ADMIN, current lead version, enabled automation, unassigned/nonclosed/nonpending lead. It queues a fresh revision atomically. Existing assignments must first be explicitly unassigned.

Transient processing errors retry after 10 then 20 seconds, stopping after three failed attempts. Expired leases after three attempts receive a terminal RETRY_EXHAUSTED review decision on recovery. Invalid policy/team-size failures stop immediately. Failure status/code and attempts remain in jobs and the lead FAILED state; a failed transaction deliberately has no successful decision record. After correction, managers explicitly request routing again.

## Permissions and interfaces

OWNER/ADMIN manage policy, preview, reroute and workspace history. OWNER edits any member profile; ADMIN edits self or MEMBER profiles, matching existing hierarchy. MEMBER cannot configure routing or preview/reroute, but can read history for leads currently assigned to self. Every operation rechecks live membership and workspace/lead scope. Server checks—not client IDs/role claims or selected-workspace cookies—authorize access. No RLS is added.

GET /api/routing/settings?workspaceId=…&page=… returns configuration, 25 member profiles/page, latest 100 forms and aggregate metrics.
GET /api/routing/preview?workspaceId=…&id=… calls the shared engine under a shared workspace lock and writes nothing.
GET /api/routing/history?workspaceId=…&id=…&page=… returns paginated decisions and latest five lead jobs. Omit id for manager workspace history.
POST /api/routing/policy, /profile, /reroute use explicit fields, Origin/session validation, a 16 KiB body limit and 60/account/action/10-minute quota.

Dashboard additions reuse existing styles: manager navigation and Team link; /dashboard/settings/routing; policy/profile forms; simulation; job counts/attempts/retries, outcomes, average measured processing duration and strategy distribution; review queue link; lead source/state/history and deliberate reroute. Detail polls while PENDING. Settings preview lists recent 20 leads; any accessible older lead can be previewed on its detail.

## Operations and limitations

npm run dev launches the routing worker alongside existing AI processing. Production separately supervises npm run routing:worker after migrations. The worker uses a pool of three, processes two claims per cycle and waits two seconds between cycles. No broker or new external integration.

Safe structured logs include event, reason/error code, attempt and duration, without enquiry/contact data. Dashboard metrics are observed aggregates, not claimed throughput benchmarks. Monitor FAILED tasks and queue age externally in production.

A decision evaluates up to 500 current workspace members; larger teams fail safely with TEAM_LIMIT. Workspace locking intentionally trades within-tenant throughput for correctness. Load aggregate/query/queue performance has not been production benchmarked. No working hours, online presence, auto-rebalancing, backfill, automatic review retries, late-AI reassignment or cross-business transfers. Form rules are configured routing labels, not assertions that the customer text was AI-classified.

See FINAL_TESTING_GUIDE.md for the complete all-phase walkthrough and deployment checklist, and phase6-completion.md for actual verification and file inventory.
