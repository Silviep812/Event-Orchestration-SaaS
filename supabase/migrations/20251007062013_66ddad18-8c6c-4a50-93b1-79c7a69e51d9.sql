-- Allow authenticated users to view basic user information for task assignments.
-- Idempotent: public."User" may already be dropped (see 20251007140737); skip if absent.
DO $$
BEGIN
  IF pg_catalog.to_regclass('public."User"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view all user profiles for task assignments" ON public."User"';
    EXECUTE $policy$
CREATE POLICY "Users can view all user profiles for task assignments"
ON public."User"
FOR SELECT
TO authenticated
USING (true)
$policy$;
  END IF;
END $$;
