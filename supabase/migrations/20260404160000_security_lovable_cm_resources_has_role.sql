-- Lovable security scan: remaining fixes not in 20260404150000
-- 1) cm_resources — drop permissive "Allow authenticated read" (USING true); one member-scoped policy
-- 2) has_role — SECURITY DEFINER must use SET search_path (search path injection)

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- cm_resources: replace overlapping PERMISSIVE policies (OR with true = everyone sees everything)
DO $$
DECLARE
  r RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_resources'
  ) THEN
    RETURN;
  END IF;

  ALTER TABLE public.cm_resources ENABLE ROW LEVEL SECURITY;

  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cm_resources'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.cm_resources', r.policyname);
  END LOOP;

  CREATE POLICY cm_resources_scoped ON public.cm_resources
  FOR ALL TO authenticated
  USING (
    cm_resources.event_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = cm_resources.event_id AND e.user_id = auth.uid()
      )
      OR (
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'cm_event_members'
        )
        AND EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id = auth.uid() AND m.event_id = cm_resources.event_id
        )
      )
    )
  )
  WITH CHECK (
    cm_resources.event_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = cm_resources.event_id AND e.user_id = auth.uid()
      )
      OR (
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'cm_event_members'
        )
        AND EXISTS (
          SELECT 1 FROM public.cm_event_members m
          WHERE m.user_id = auth.uid() AND m.event_id = cm_resources.event_id
        )
      )
    )
  );

  REVOKE ALL ON public.cm_resources FROM anon;
END $$;

NOTIFY pgrst, 'reload schema';
