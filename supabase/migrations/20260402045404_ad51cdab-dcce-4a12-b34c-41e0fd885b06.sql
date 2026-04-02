
-- Fix 1: Remove ALL duplicate cr_update_own policies and keep only the secure one
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'change_requests' AND schemaname = 'public' AND policyname = 'cr_update_own'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.change_requests', pol.policyname);
  END LOOP;
END $$;

-- Recreate the single correct policy
CREATE POLICY "cr_update_own" ON public.change_requests
  FOR UPDATE TO authenticated
  USING ((requested_by)::text = (auth.uid())::text)
  WITH CHECK ((requested_by)::text = (auth.uid())::text);

-- Fix 2: Tighten email_events INSERT policy to require user_id = auth.uid()
DROP POLICY IF EXISTS "email_events_system_insert" ON public.email_events;

CREATE POLICY "email_events_system_insert" ON public.email_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
