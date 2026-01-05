-- Restrict public access to public."User" and require authentication + ownership
BEGIN;

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to replace with authenticated-scoped versions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='User' AND policyname='Users can create their own profile'
  ) THEN
    DROP POLICY "Users can create their own profile" ON public."User";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='User' AND policyname='Users can delete their own profile'
  ) THEN
    DROP POLICY "Users can delete their own profile" ON public."User";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='User' AND policyname='Users can update their own profile'
  ) THEN
    DROP POLICY "Users can update their own profile" ON public."User";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='User' AND policyname='Users can view their own profile'
  ) THEN
    DROP POLICY "Users can view their own profile" ON public."User";
  END IF;
END $$;

-- Recreate least-privilege policies with TO authenticated
CREATE POLICY "Users can create their own profile"
ON public."User"
FOR INSERT
TO authenticated
WITH CHECK (userid = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public."User"
FOR UPDATE
TO authenticated
USING (userid = auth.uid())
WITH CHECK (userid = auth.uid());

CREATE POLICY "Users can delete their own profile"
ON public."User"
FOR DELETE
TO authenticated
USING (userid = auth.uid());

CREATE POLICY "Users can view their own profile"
ON public."User"
FOR SELECT
TO authenticated
USING (userid = auth.uid());

COMMIT;