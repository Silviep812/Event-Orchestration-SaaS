## Problem

The `checklist` column now exists on `public.tasks` (verified in `information_schema.columns`), but the API still returns `PGRST204 — Could not find 'checklist' column of 'tasks' in the schema cache`. This means PostgREST (Supabase's REST layer) is still serving the **old cached schema** and hasn't picked up the new column yet.

## Fix

Run a one-line migration that tells PostgREST to reload its schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

That's the standard Supabase remedy for PGRST204 right after an `ALTER TABLE`. No app code changes needed — the insert payload already includes `checklist`, the column already exists, only the cache is stale.

## After running

Try "Save task assignment" again. If it still fails, the new toast (we already wired the real error message into the catch block) will show the exact reason — send that text back and we'll target it.
