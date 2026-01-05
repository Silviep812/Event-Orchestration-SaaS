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

-- Add policy to allow users to view profiles of their team members
CREATE POLICY "Users can view team members profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.are_team_members(auth.uid(), user_id));

-- Add policy to allow users to view User table data of their team members
CREATE POLICY "Users can view team members user data"
ON public."User"
FOR SELECT
TO authenticated
USING (public.are_team_members(auth.uid(), userid));

-- Add policy to allow users to view User Profile data of their team members
CREATE POLICY "Users can view team members user profile data"
ON public."User Profile"
FOR SELECT
TO authenticated
USING (public.are_team_members(auth.uid(), user_id));