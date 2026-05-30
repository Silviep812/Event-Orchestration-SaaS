-- Restrict broad write access on directory/shared tables to coordinator+ roles

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'Bookings Profile',
    'Venue Profile',
    'Vendor Profile',
    'Supplier Vendor Profile',
    'hospitality_profiles',
    'suppliers',
    'external_vendor directory',
    'external_vendor profile',
    'workflow_types'
  ];
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      CONTINUE;
    END IF;

    -- Drop ALL existing INSERT/UPDATE/DELETE policies on the table
    FOR pol IN
      SELECT policyname, cmd FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
        AND cmd IN ('INSERT','UPDATE','DELETE')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    -- Recreate restricted write policies (coordinator+ for write, admin for delete)
    EXECUTE format($f$
      CREATE POLICY "%1$s_insert_coordinator" ON public.%1$I
      FOR INSERT TO authenticated
      WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level))
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "%1$s_update_coordinator" ON public.%1$I
      FOR UPDATE TO authenticated
      USING (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level))
      WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level))
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "%1$s_delete_admin" ON public.%1$I
      FOR DELETE TO authenticated
      USING (public.policy_has_permission_level(auth.uid(), 'admin'::permission_level))
    $f$, t);
  END LOOP;
END $$;