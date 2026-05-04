-- Step 1: Drop the current constraint
DROP INDEX IF EXISTS user_roles_user_role_event_unique;

-- Step 2: Clean up existing duplicates FIRST (keep most recent role per user per event)
WITH ranked_roles AS (
  SELECT 
    id,
    user_id,
    event_id,
    role,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid) 
      ORDER BY created_at DESC
    ) as rn
  FROM public.user_roles
)
DELETE FROM public.user_roles
WHERE id IN (
  SELECT id FROM ranked_roles WHERE rn > 1
);

-- Step 3: Now create the constraint allowing only ONE role per user per event
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_event_unique 
ON public.user_roles (user_id, COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid));