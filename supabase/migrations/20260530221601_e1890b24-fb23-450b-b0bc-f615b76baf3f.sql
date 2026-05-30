
-- 1) Subscription_Plans Profile: restrict write to admins
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public."Subscription_Plans Profile"'::regclass
      AND polcmd IN ('a','w','d') -- INSERT, UPDATE, DELETE
  LOOP
    EXECUTE format('DROP POLICY %I ON public."Subscription_Plans Profile"', r.polname);
  END LOOP;
END $$;

CREATE POLICY "Admins can insert subscription plans"
  ON public."Subscription_Plans Profile"
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can update subscription plans"
  ON public."Subscription_Plans Profile"
  FOR UPDATE TO authenticated
  USING (public.has_permission_level(auth.uid(), 'admin'::permission_level))
  WITH CHECK (public.has_permission_level(auth.uid(), 'admin'::permission_level));

CREATE POLICY "Admins can delete subscription plans"
  ON public."Subscription_Plans Profile"
  FOR DELETE TO authenticated
  USING (public.has_permission_level(auth.uid(), 'admin'::permission_level));

-- 2) teams: SELECT only for members (via team_assignments)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public.teams'::regclass
      AND polcmd = 'r' -- SELECT
  LOOP
    EXECUTE format('DROP POLICY %I ON public.teams', r.polname);
  END LOOP;
END $$;

CREATE POLICY "Users can view teams they belong to"
  ON public.teams
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT team_id FROM public.team_assignments WHERE user_id = auth.uid())
    OR public.has_permission_level(auth.uid(), 'admin'::permission_level)
  );

-- 3) Directory tables: INSERT requires coordinator+
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public.entertainments'::regclass AND polcmd = 'a'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.entertainments', r.polname);
  END LOOP;
  FOR r IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public.vendor'::regclass AND polcmd = 'a'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.vendor', r.polname);
  END LOOP;
  FOR r IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public.marketing_profiles'::regclass AND polcmd = 'a'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.marketing_profiles', r.polname);
  END LOOP;
END $$;

CREATE POLICY "entertainments_insert_coordinator"
  ON public.entertainments
  FOR INSERT TO authenticated
  WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level));

CREATE POLICY "vendor_insert_coordinator"
  ON public.vendor
  FOR INSERT TO authenticated
  WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level));

CREATE POLICY "marketing_profiles_insert_coordinator"
  ON public.marketing_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.policy_has_min_permission_level(auth.uid(), 'coordinator'::permission_level));
