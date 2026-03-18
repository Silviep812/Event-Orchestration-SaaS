
-- 1. Fix rsvp_submissions: Remove public SELECT, keep event-owner policy
DROP POLICY IF EXISTS "Anyone can view RSVP submissions" ON public.rsvp_submissions;

-- 2. Fix Check Lists: Replace overly permissive ALL policy with scoped policies
DROP POLICY IF EXISTS "Authenticated users can manage check lists" ON public."Check Lists";

CREATE POLICY "Users can view own or event checklists"
ON public."Check Lists"
FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = entity_id AND e.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.permission_level IN ('admin', 'coordinator')
  )
);

CREATE POLICY "Users can insert checklists for own events"
ON public."Check Lists"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = entity_id AND e.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.permission_level IN ('admin', 'coordinator')
  )
);

CREATE POLICY "Users can update own or event checklists"
ON public."Check Lists"
FOR UPDATE
TO authenticated
USING (
  assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = entity_id AND e.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.permission_level IN ('admin', 'coordinator')
  )
);

CREATE POLICY "Users can delete own event checklists"
ON public."Check Lists"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = entity_id AND e.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.permission_level IN ('admin', 'coordinator')
  )
);

-- 3. Fix teams: Replace permissive UPDATE/DELETE with ownership checks
DROP POLICY IF EXISTS "Authenticated users can update teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can delete teams" ON public.teams;

CREATE POLICY "Team admins can update teams"
ON public.teams
FOR UPDATE
TO authenticated
USING (
  is_team_admin(auth.uid(), id)
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.permission_level = 'admin'
  )
);

CREATE POLICY "Team admins can delete teams"
ON public.teams
FOR DELETE
TO authenticated
USING (
  is_team_admin(auth.uid(), id)
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.permission_level = 'admin'
  )
);

-- 4. Fix confirmation_submissions: Replace broken SELECT policy
DROP POLICY IF EXISTS "Event owners can view confirmation submissions" ON public.confirmation_submissions;

CREATE POLICY "Event owners can view confirmation submissions"
ON public.confirmation_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.user_id = auth.uid()
    AND (e.id)::text = confirmation_submissions.event_id
  )
  OR EXISTS (
    SELECT 1 FROM public."Create Event" ce
    WHERE ce.userid = (auth.uid())::text
    AND ce.userid = confirmation_submissions.book_id
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.permission_level IN ('admin', 'coordinator')
  )
);
