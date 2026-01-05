-- Harden RLS for public."User Profile" to restrict access to authenticated users only
BEGIN;

ALTER TABLE public."User Profile" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with TO authenticated scoping
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='User Profile' AND policyname='Admins can view all user profiles'
  ) THEN
    DROP POLICY "Admins can view all user profiles" ON public."User Profile";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='User Profile' AND policyname='Users can claim legacy user profile'
  ) THEN
    DROP POLICY "Users can claim legacy user profile" ON public."User Profile";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='User Profile' AND policyname='Users can create their own user profile'
  ) THEN
    DROP POLICY "Users can create their own user profile" ON public."User Profile";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='User Profile' AND policyname='Users can delete their own user profile'
  ) THEN
    DROP POLICY "Users can delete their own user profile" ON public."User Profile";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='User Profile' AND policyname='Users can update their own user profile'
  ) THEN
    DROP POLICY "Users can update their own user profile" ON public."User Profile";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='User Profile' AND policyname='Users can view their own user profile'
  ) THEN
    DROP POLICY "Users can view their own user profile" ON public."User Profile";
  END IF;
END $$;

-- Recreate policies scoped to authenticated role only
CREATE POLICY "Admins can view all user profiles"
ON public."User Profile"
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can claim legacy user profile"
ON public."User Profile"
FOR UPDATE
TO authenticated
USING ((user_id IS NULL) AND ("User_Email" IS NOT NULL) AND (lower("User_Email") = lower((auth.jwt() ->> 'email'))))
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can create their own user profile"
ON public."User Profile"
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own user profile"
ON public."User Profile"
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own user profile"
ON public."User Profile"
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own user profile"
ON public."User Profile"
FOR SELECT
TO authenticated
USING ((user_id = auth.uid()) OR ((user_id IS NULL) AND ("User_Email" IS NOT NULL) AND (lower("User_Email") = lower((auth.jwt() ->> 'email')))));

COMMIT;