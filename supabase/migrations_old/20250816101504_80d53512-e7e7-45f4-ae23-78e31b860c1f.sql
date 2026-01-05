-- Restrict public read access on public."User" and provide a safe admin-only directory

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Drop existing PUBLIC policies and recreate them for authenticated users only
DROP POLICY IF EXISTS "Users can view their own profile" ON public."User";
DROP POLICY IF EXISTS "Users can update their own profile" ON public."User";
DROP POLICY IF EXISTS "Users can delete their own profile" ON public."User";
DROP POLICY IF EXISTS "Users can create their own profile" ON public."User";

CREATE POLICY "Users can view their own profile"
ON public."User"
FOR SELECT
TO authenticated
USING (userid = auth.uid());

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

CREATE POLICY "Users can create their own profile"
ON public."User"
FOR INSERT
TO authenticated
WITH CHECK (userid = auth.uid());

-- Create a safe directory function for admins and event managers only
CREATE OR REPLACE FUNCTION public.get_user_directory_safe()
RETURNS TABLE(userid uuid, user_name text, contact_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT u.userid, u.user_name, u.contact_name
  FROM public."User" u
  WHERE has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'event_manager');
$$;