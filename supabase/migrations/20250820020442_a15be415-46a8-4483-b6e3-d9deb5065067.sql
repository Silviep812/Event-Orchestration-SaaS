-- Secure RLS for public."User Profile" with owner-based access and legacy transition
-- Idempotent: user_id / FK / policies may already exist (remote parity).

-- 1) Ensure RLS enabled
ALTER TABLE public."User Profile" ENABLE ROW LEVEL SECURITY;

-- 2) Add user_id column and FK to auth.users (nullable initially for backfill)
ALTER TABLE public."User Profile"
  ADD COLUMN IF NOT EXISTS user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profile_user_id_fk'
      AND conrelid = 'public."User Profile"'::regclass
  ) THEN
    ALTER TABLE public."User Profile"
      ADD CONSTRAINT user_profile_user_id_fk
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3) Index for performance
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON public."User Profile" (user_id);

-- 4) Trigger to attach new rows to the current user automatically
CREATE OR REPLACE FUNCTION public.set_user_profile_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id IS NULL THEN
      NEW.user_id := auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_profile_user_id_trigger ON public."User Profile";
CREATE TRIGGER set_user_profile_user_id_trigger
BEFORE INSERT ON public."User Profile"
FOR EACH ROW EXECUTE FUNCTION public.set_user_profile_user_id();

-- 5) RLS Policies
DROP POLICY IF EXISTS "Users can view their own user profile" ON public."User Profile";
DROP POLICY IF EXISTS "Users can create their own user profile" ON public."User Profile";
DROP POLICY IF EXISTS "Users can update their own user profile" ON public."User Profile";
DROP POLICY IF EXISTS "Users can claim legacy user profile" ON public."User Profile";
DROP POLICY IF EXISTS "Users can delete their own user profile" ON public."User Profile";
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public."User Profile";
DROP POLICY IF EXISTS "Admins can manage user profiles" ON public."User Profile";

-- Owner-based access
CREATE POLICY "Users can view their own user profile"
ON public."User Profile"
FOR SELECT
USING (
  user_id = auth.uid()
  OR (
    user_id IS NULL
    AND "User_Email" IS NOT NULL
    AND lower("User_Email") = lower((auth.jwt() ->> 'email'))
  )
);

CREATE POLICY "Users can create their own user profile"
ON public."User Profile"
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own user profile"
ON public."User Profile"
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to claim legacy rows (user_id null) by setting user_id to themselves on update
CREATE POLICY "Users can claim legacy user profile"
ON public."User Profile"
FOR UPDATE
USING (
  user_id IS NULL
  AND "User_Email" IS NOT NULL
  AND lower("User_Email") = lower((auth.jwt() ->> 'email'))
)
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own user profile"
ON public."User Profile"
FOR DELETE
USING (user_id = auth.uid());

-- Admin support access (read-only by default)
CREATE POLICY "Admins can view all user profiles"
ON public."User Profile"
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
