

# Security Remediation Plan — Error-Level Findings

## Summary of Findings

| # | Finding | Current State | Action |
|---|---------|--------------|--------|
| 1 | Views bypass RLS (event_task_timeline_view + 9 others) | All 10 views already have `security_invoker=true` set | **No action needed** — false positive |
| 2 | Magic link tokens in public schema | Table has `USING: false` RLS policies blocking all API access | Remediate by dropping the plaintext token columns entirely |
| 3 | Submission tables missing ownership check on INSERT | 5 tables (rsvp, registry, qrcode, confirmation, reservation) allow any authenticated user to submit against any valid `book_id` | Add ownership verification to INSERT policies |
| 4 | `team_admins` table has no RLS | RLS is disabled, table is fully public | Enable RLS and add scoped policies |

---

## Fix 1: Drop magic link token columns from Authorization table

The `Authorization` table stores `magic_link_token` and related columns in plaintext. Since Supabase's built-in auth handles magic links, these custom columns are a liability. We will drop all `magic_link_*` columns and remove any code referencing them.

**Migration:**
- Drop columns: `magic_link_token`, `magic_link_expires_at`, `magic_link_sent_at`, `magic_link_used`, `magic_link_used_at`, `magic_link_request_count`, `magic_link_requested_ip`, `magic_link_enabled`
- Drop functions `generate_magic_link` and `validate_magic_link` which operate on these columns

**Code changes:** Search for and remove any frontend references to these functions.

---

## Fix 2: Add ownership checks to submission table INSERT policies

Currently any authenticated user can submit against any valid `book_id`. We will replace the INSERT policies on all 5 tables to also verify the booking belongs to the authenticated user.

**Migration (for each of the 5 tables):**
- Drop existing INSERT policy
- Create new INSERT policy that adds: `AND bd.user_id = auth.uid()` to the ownership check

Tables: `rsvp_submissions`, `registry_submissions`, `qrcode_submissions`, `confirmation_submissions`, `reservation_submissions`

---

## Fix 3: Enable RLS on `team_admins` and add policies

**Migration:**
- `ALTER TABLE team_admins ENABLE ROW LEVEL SECURITY`
- SELECT policy: users can see rows where they are a member of the team (via `team_assignments`)
- INSERT/UPDATE/DELETE policy: only existing team admins (via `is_team_admin` function) can manage

---

## Technical Details

All changes are database migrations only — no frontend code changes expected (unless magic link functions are called from the client, which will be verified before implementation).

