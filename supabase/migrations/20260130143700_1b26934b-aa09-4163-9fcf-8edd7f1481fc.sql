-- =====================================================
-- CRITICAL SECURITY FIX: Lock down publicly exposed tables
-- =====================================================

-- 1. BARCODE_SUBMISSIONS: Restrict to event owners only
DROP POLICY IF EXISTS "Anyone can view barcode submissions" ON public.barcode_submissions;
DROP POLICY IF EXISTS "Anyone can create barcode submissions" ON public.barcode_submissions;

CREATE POLICY "Event owners can view barcode submissions"
ON public.barcode_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Create Event" ce 
    WHERE ce.userid = auth.uid()::text 
    AND ce.userid = barcode_submissions.book_id
  )
  OR 
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.user_id = auth.uid() 
    AND e.id::text = barcode_submissions.book_id
  )
);

CREATE POLICY "Authenticated users can create barcode submissions"
ON public.barcode_submissions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. CONFIRMATION_SUBMISSIONS: Restrict to event owners
DROP POLICY IF EXISTS "Anyone can view confirmation submissions" ON public.confirmation_submissions;
DROP POLICY IF EXISTS "Anyone can create confirmation submissions" ON public.confirmation_submissions;

CREATE POLICY "Event owners can view confirmation submissions"
ON public.confirmation_submissions
FOR SELECT
TO authenticated
USING (
  event_id IS NULL 
  OR event_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM events e WHERE e.user_id = auth.uid() AND e.id::text = confirmation_submissions.event_id
  )
);

CREATE POLICY "Authenticated users can create confirmation submissions"
ON public.confirmation_submissions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. REGISTRY_SUBMISSIONS: Restrict to book owners
DROP POLICY IF EXISTS "Anyone can view registry submissions" ON public.registry_submissions;
DROP POLICY IF EXISTS "Anyone can create registry submissions" ON public.registry_submissions;

CREATE POLICY "Book owners can view registry submissions"
ON public.registry_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Bookings Directory" bd 
    WHERE bd.user_id = auth.uid() 
    AND bd.book_id = registry_submissions.book_id
  )
  OR
  EXISTS (
    SELECT 1 FROM "Create Event" ce 
    WHERE ce.userid = auth.uid()::text 
    AND ce.userid = registry_submissions.book_id
  )
);

CREATE POLICY "Authenticated users can create registry submissions"
ON public.registry_submissions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. RESERVATION_SUBMISSIONS: Restrict to event/venue owners
DROP POLICY IF EXISTS "Anyone can view reservation submissions" ON public.reservation_submissions;
DROP POLICY IF EXISTS "Anyone can create reservation submissions" ON public.reservation_submissions;

CREATE POLICY "Event owners can view reservation submissions"
ON public.reservation_submissions
FOR SELECT
TO authenticated
USING (
  event_id IS NULL
  OR event_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM events e WHERE e.user_id = auth.uid() AND e.id::text = reservation_submissions.event_id
  )
  OR EXISTS (
    SELECT 1 FROM venues v WHERE v.user_id = auth.uid() AND v.id = reservation_submissions.venue_id
  )
);

CREATE POLICY "Authenticated users can create reservation submissions"
ON public.reservation_submissions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. RSVP_SUBMISSIONS: Restrict to event owners
DROP POLICY IF EXISTS "Anyone can view rsvp submissions" ON public.rsvp_submissions;
DROP POLICY IF EXISTS "Anyone can create rsvp submissions" ON public.rsvp_submissions;

CREATE POLICY "Event owners can view rsvp submissions"
ON public.rsvp_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Create Event" ce 
    WHERE ce.userid = auth.uid()::text 
    AND ce.userid = rsvp_submissions.book_id
  )
  OR
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.user_id = auth.uid() 
    AND e.id::text = rsvp_submissions.book_id
  )
);

CREATE POLICY "Authenticated users can create rsvp submissions"
ON public.rsvp_submissions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. PROFILES: Replace overly permissive policy with team-based access
DROP POLICY IF EXISTS "Users can view all profiles for assignments" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Team members can view teammate profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.are_team_members(auth.uid(), user_id)
);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_permission_level(auth.uid(), 'admin'::permission_level)
);

-- 7. AUTHORIZATION TABLE: Block all direct access (use Supabase auth instead)
DROP POLICY IF EXISTS "Block all access to Authorization" ON public."Authorization";

CREATE POLICY "Block all access to Authorization"
ON public."Authorization"
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 8. USER ROLES: Remove bootstrap policies (privilege escalation risk)
DROP POLICY IF EXISTS "Bootstrap: Allow role assignment for non-admin users" ON public.user_roles;

-- 9. Fix search_path on commonly used functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$ 
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END; 
$function$;

-- 10. Add RLS to views by ensuring SECURITY INVOKER
-- Note: Views need to be recreated with security_invoker=on
-- This is informational - existing views with SECURITY INVOKER are already set