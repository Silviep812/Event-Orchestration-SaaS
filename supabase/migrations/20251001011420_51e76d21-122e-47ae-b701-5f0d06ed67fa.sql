-- Create a security definer function to check if two users are in the same team
CREATE OR REPLACE FUNCTION public.are_team_members(_user_id_1 uuid, _user_id_2 uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_assignments ta1
    JOIN public.team_assignments ta2 ON ta1.team_id = ta2.team_id
    WHERE ta1.user_id = _user_id_1
      AND ta2.user_id = _user_id_2
  )
$$;

DROP POLICY IF EXISTS "Users can view team members profiles" ON public.profiles;
CREATE POLICY "Users can view team members profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.are_team_members(auth.uid(), user_id));

DO $pol$
BEGIN
  IF pg_catalog.to_regclass('public."User"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view team members user data" ON public."User"';
    EXECUTE $p$
      CREATE POLICY "Users can view team members user data"
      ON public."User"
      FOR SELECT
      TO authenticated
      USING (public.are_team_members(auth.uid(), userid))
    $p$;
  END IF;

  IF pg_catalog.to_regclass('public."User Profile"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view team members user profile data" ON public."User Profile"';
    EXECUTE $p$
      CREATE POLICY "Users can view team members user profile data"
      ON public."User Profile"
      FOR SELECT
      TO authenticated
      USING (public.are_team_members(auth.uid(), user_id))
    $p$;
  END IF;
END $pol$;
