-- Drop ALL cr_update_own policies on change_requests (there are duplicates)
DO $$
DECLARE
  pol RECORD;
  counter INT := 0;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'change_requests' AND schemaname = 'public' AND policyname = 'cr_update_own'
  LOOP
    counter := counter + 1;
    EXECUTE format('DROP POLICY %I ON public.change_requests', pol.policyname);
  END LOOP;
  RAISE NOTICE 'Dropped % cr_update_own policies', counter;
END $$;

-- Recreate the single correct policy with ownership enforcement
CREATE POLICY "cr_update_own" ON public.change_requests
  FOR UPDATE TO authenticated
  USING ((requested_by)::text = (auth.uid())::text)
  WITH CHECK ((requested_by)::text = (auth.uid())::text);