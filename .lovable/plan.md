## Goal

Stop hiding the real error behind the generic "Failed to create task" toast in Project Management → Add task assignment, so we (and you) can see exactly why Supabase is rejecting the insert.

## Change

In `src/components/TaskManager.tsx`, `executeCreateTask` catch block (lines 1266–1275):

1. Show the actual error message in the toast description (Supabase `PostgrestError` has `message`, `details`, `hint`, `code` — surface `message` + `details/hint` when present) instead of the hard-coded "Failed to create task. Please try again.".
2. Keep the special-case for circular dependencies.
3. Also log the full error object via a Sonner toast-friendly path (still no `console.error`, per the project's clean-console rule — we'll expand the toast `description` instead).

No schema changes, no RLS changes, no behavior changes to the happy path.

## After you re-try

Click Save again — the toast will now read the actual reason, e.g.:
- `new row violates row-level security policy for table "tasks"` → RLS
- `null value in column "event_id" violates not-null constraint` → no event picked
- `duplicate key value violates unique constraint ...` → assignee/event clash
- a custom trigger message

Send that exact text back and the next step is a targeted fix (RLS policy, required-field guard, or trigger change).

## Files touched

- `src/components/TaskManager.tsx` — ~8 lines in the catch block only.
