-- cm_event_members SELECT policy referenced the same table inside EXISTS, which re-ran RLS
-- and caused: "infinite recursion detected in policy for relation cm_event_members".
-- Helpers read membership with row_security off; policies stay non-recursive.

CREATE OR REPLACE FUNCTION public.user_is_member_of_event(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
SET row_security = off
AS $$
  SELECT p_event_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.cm_event_members m
      WHERE m.event_id = p_event_id
        AND m.user_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.user_is_member_of_event(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_member_of_event(uuid) TO authenticated;

COMMENT ON FUNCTION public.user_is_member_of_event(uuid) IS
  'True if auth.uid() has a cm_event_members row for the event. SECURITY DEFINER + row_security off avoids RLS recursion when used from policies.';

DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_event_members'
  ) THEN
    ALTER TABLE public.cm_event_members ENABLE ROW LEVEL SECURITY;

    FOR r IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'cm_event_members'
        AND cmd = 'SELECT'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.cm_event_members', r.policyname);
    END LOOP;

    CREATE POLICY cm_event_members_select_scoped
    ON public.cm_event_members
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.events e
        WHERE e.id = cm_event_members.event_id
          AND e.user_id = auth.uid()
      )
      OR public.user_is_member_of_event(cm_event_members.event_id)
    );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
