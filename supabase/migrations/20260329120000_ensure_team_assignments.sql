-- Ensure team_assignments exists (fixes PostgREST: table not in schema cache).
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.team_assignments (
  id SERIAL PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_admin boolean NOT NULL DEFAULT false,
  is_coordinator boolean NOT NULL DEFAULT false,
  is_viewer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_assignments
  ADD COLUMN IF NOT EXISTS is_coordinator boolean NOT NULL DEFAULT false;
ALTER TABLE public.team_assignments
  ADD COLUMN IF NOT EXISTS is_viewer boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_assignments
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND team_admin = true
  );
$$;

ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their team assignments" ON public.team_assignments;
DROP POLICY IF EXISTS "Users can insert their own team assignments" ON public.team_assignments;
DROP POLICY IF EXISTS "Team admins can manage team assignments" ON public.team_assignments;
DROP POLICY IF EXISTS "Users can view team assignments they are part of" ON public.team_assignments;
DROP POLICY IF EXISTS "Team admins can add members" ON public.team_assignments;
DROP POLICY IF EXISTS "Team admins can update members" ON public.team_assignments;
DROP POLICY IF EXISTS "Team admins can remove members" ON public.team_assignments;

CREATE POLICY "Users can view their team assignments"
ON public.team_assignments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own team assignments"
ON public.team_assignments
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Team admins can manage team assignments"
ON public.team_assignments
FOR ALL
TO authenticated
USING (public.is_team_admin(auth.uid(), team_id))
WITH CHECK (public.is_team_admin(auth.uid(), team_id));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS update_team_assignments_updated_at ON public.team_assignments;
    CREATE TRIGGER update_team_assignments_updated_at
    BEFORE UPDATE ON public.team_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Hint PostgREST to reload schema (helps clear "not in schema cache" after CREATE TABLE)
NOTIFY pgrst, 'reload schema';
