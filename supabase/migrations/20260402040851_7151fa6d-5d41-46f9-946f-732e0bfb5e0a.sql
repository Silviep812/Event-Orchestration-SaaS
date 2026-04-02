-- Fix 1: Remove the (event_id IS NULL) permissive branch from reservation_submissions SELECT policy
DROP POLICY IF EXISTS "Event owners can view reservation submissions" ON public.reservation_submissions;

CREATE POLICY "Event owners can view reservation submissions"
ON public.reservation_submissions
FOR SELECT
USING (
  (event_id = (auth.uid())::text) OR
  (EXISTS (
    SELECT 1 FROM events e
    WHERE e.user_id = auth.uid() AND (e.id)::text = reservation_submissions.event_id
  )) OR
  (EXISTS (
    SELECT 1 FROM venues v
    WHERE v.user_id = auth.uid() AND v.id = reservation_submissions.venue_id
  ))
);

-- Fix 2: Restrict hospitality_profile_amenities DELETE to admins (matching parent table policy)
DROP POLICY IF EXISTS "Authenticated users can delete hospitality profile amenities" ON public.hospitality_profile_amenities;

CREATE POLICY "Admins can delete hospitality profile amenities"
ON public.hospitality_profile_amenities
FOR DELETE
USING (has_permission_level(auth.uid(), 'admin'::permission_level));

-- Also restrict the INSERT policy to admins for consistency
DROP POLICY IF EXISTS "Authenticated users can create hospitality profile amenities" ON public.hospitality_profile_amenities;

CREATE POLICY "Admins can create hospitality profile amenities"
ON public.hospitality_profile_amenities
FOR INSERT
WITH CHECK (has_permission_level(auth.uid(), 'admin'::permission_level));