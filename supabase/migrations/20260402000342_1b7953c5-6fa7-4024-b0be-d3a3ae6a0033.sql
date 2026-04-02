-- 1. Add INSERT policy for private_profiles
CREATE POLICY "owner_insert_private" ON public.private_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2. Fix cr_update_own on change_requests (drop duplicates, recreate properly)
DROP POLICY IF EXISTS "cr_update_own" ON public.change_requests;
CREATE POLICY "cr_update_own" ON public.change_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = requested_by)
  WITH CHECK (auth.uid() = requested_by);