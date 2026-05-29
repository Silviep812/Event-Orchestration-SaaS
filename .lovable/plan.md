## Re-scan results

122 findings total: 6 new contextual (supabase_lov) + 116 platform-linter (supabase).

### Contextual findings to fix (warn-level, no critical/error)

1. **`cm_change_requests` requester self-update can mutate `event_id`** — `cm_cr_update_requester_open` has no constraint preventing the requester from changing `event_id` on their own pending request.
2. **`discussion_comments` SELECT is open to all authenticated users** — should be scoped to event members/owners via `entity_id`.
3. **`teams` UPDATE/DELETE** use `auth.role()='authenticated'` with no ownership check — any signed-in user can rename/delete any team. Restrict to team admins (`is_team_admin`).
4. **`Collaborators` SELECT** has a public/anon `USING: true` policy — restrict to `authenticated`.
5. **`Event Resources` SELECT** is open to all authenticated users — scope to event owner/members.
6. **`transportations` SELECT** has an anon `USING: true` policy — restrict to `authenticated`.

### Platform-linter findings (116)

- **~96 `SECURITY DEFINER` functions executable by `anon`/`authenticated`** — many are internal helpers (e.g. `apply_change_request`, `recalculate_*`, `cm_activity_log_event`, role/team helpers) that should not be callable directly over PostgREST. Plan: `REVOKE EXECUTE ... FROM anon, authenticated` on the internal ones; keep execute granted on the small set that the app actually RPCs from the client (e.g. `has_role`, `has_permission_level`, `approve_change_request_wr`, `get_my_events_safe`, `get_user_directory_safe`, `update_resource_utilization`). I'll audit `supabase.rpc(...)` call sites in `src/` to build the keep-list before drafting the migration.
- **~12 functions with mutable `search_path`** — add `SET search_path = public` to each (matches project core rule).
- **4 `RLS Policy Always True`** — find and tighten the remaining permissive INSERT/UPDATE/DELETE policies surfaced by the lov findings above (likely the same ones).
- **1 `Materialized View in API`** — revoke API role grants on the materialized view (probably `event_kpi_view`-adjacent); confirm with `pg_matviews` first.
- **1 `Public Bucket Allows Listing`** — narrow the bucket's SELECT policy from "list all" to a per-folder/per-owner check; confirm which bucket is flagged first.
- **1 `RLS Enabled No Policy`** (info) — identify the table; either add a policy or document as intentionally locked.
- **`Auth OTP long expiry`** (config) — flagged previously; requires Supabase Auth dashboard change (not a SQL migration). Will note for manual action.

### Out of scope / will keep as-is

- `realtime.messages` RLS, `marketing_subscribers` anon insert, and `Bookings Profile` ownership — already documented in `@security-memory` as intentional / requires product decision.
- `Pay_Method` move off `User Profile` to `private_profiles` — still pending; not part of this round (data migration, separate confirmation).

### Execution plan (one migration in build mode)

1. Audit `src/` for every `supabase.rpc('<fn>', ...)` call → keep-list for grants.
2. Single migration that:
   - Tightens the 6 contextual policies above.
   - Adds `SET search_path = public` to each function missing it.
   - `REVOKE EXECUTE ... FROM anon, authenticated` on internal SECURITY DEFINER functions not in the keep-list; explicit `GRANT EXECUTE` to the keep-list.
   - Restricts API role grants on the flagged materialized view.
   - Narrows the public bucket SELECT policy.
3. Re-run scanner, then `manage_security_finding` to mark resolved and update `@security-memory` with the new keep-list and the OTP-expiry follow-up.

### Risks to flag before applying

- Tightening SECURITY DEFINER execute grants could break any client-side `supabase.rpc(...)` call I miss in the audit. Mitigation: build the keep-list from a code search before writing the migration; users will see clear errors in dev if anything is missed and we can re-grant quickly.
- Scoping `Event Resources` and `discussion_comments` to event members assumes `cm_event_members` (or the equivalent) is populated for all current users in active events. I'll spot-check membership coverage first.
- `Auth OTP long expiry` cannot be fixed via migration — needs a manual change in Supabase Auth settings.

Approve to switch to build mode and apply.