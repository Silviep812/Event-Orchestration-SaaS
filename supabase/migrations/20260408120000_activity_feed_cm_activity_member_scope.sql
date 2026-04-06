-- Lovable / advisor: "activity_feed has no RLS" — activity_feed is a VIEW over cm_activity.
-- Row access is enforced via security_invoker + RLS on public.cm_activity (not policies on the view).
-- We tighten cm_activity SELECT for event members so invoker semantics match "owners + members".

DO $$
DECLARE
  rk char;
BEGIN
  SELECT c.relkind INTO rk
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'activity_feed';

  IF rk = 'v' THEN
    EXECUTE 'ALTER VIEW public.activity_feed SET (security_invoker = true)';
    EXECUTE 'ALTER VIEW public.activity_feed SET (security_barrier = true)';
    EXECUTE 'REVOKE ALL ON public.activity_feed FROM anon';
    EXECUTE 'GRANT SELECT ON public.activity_feed TO authenticated';
    EXECUTE $c$
      COMMENT ON VIEW public.activity_feed IS
        'SECURITY INVOKER view over public.cm_activity; row access follows cm_activity RLS (not a base table).'
    $c$;
  END IF;
END $$;

-- Event collaborators: can read activity rows for events they belong to (PERMISSIVE OR with owner policy)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_activity'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cm_event_members'
  ) THEN
    ALTER TABLE public.cm_activity ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Member can view cm_activity" ON public.cm_activity;

    CREATE POLICY "Member can view cm_activity"
    ON public.cm_activity
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.cm_event_members m
        WHERE m.event_id::text = cm_activity.event_id::text
          AND m.user_id::text = auth.uid()::text
      )
    );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
