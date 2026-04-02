-- Use pg_policy OIDs to drop ALL duplicates
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Keep dropping until none remain
  WHILE EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'change_requests' AND schemaname = 'public' AND policyname = 'cr_update_own') LOOP
    EXECUTE 'DROP POLICY "cr_update_own" ON public.change_requests';
  END LOOP;
END $$;

-- Recreate the single correct policy
CREATE POLICY "cr_update_own" ON public.change_requests
  FOR UPDATE TO authenticated
  USING ((requested_by)::text = (auth.uid())::text)
  WITH CHECK ((requested_by)::text = (auth.uid())::text);