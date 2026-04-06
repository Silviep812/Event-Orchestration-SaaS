-- Lovable / advisor fixes:
-- 1) reservation_submissions: no (event_id IS NULL) catch-all; scoped SELECT for owners / venues.
-- 2) hospitality_profile_amenities: INSERT/DELETE admin-only (matches parent hospitality_profiles).

-- ─── reservation_submissions ───────────────────────────────────────────────────
ALTER TABLE public.reservation_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event owners can view reservation submissions" ON public.reservation_submissions;
DROP POLICY IF EXISTS "Anyone can view reservation submissions" ON public.reservation_submissions;

CREATE POLICY "Event owners can view reservation submissions"
ON public.reservation_submissions
FOR SELECT
TO authenticated
USING (
  (reservation_submissions.event_id::text = auth.uid()::text)
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.user_id::text = auth.uid()::text
      AND e.id::text = reservation_submissions.event_id::text
  )
  OR (
    reservation_submissions.venue_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.venues v
      WHERE v.user_id::text = auth.uid()::text
        AND v.id::text = reservation_submissions.venue_id::text
    )
  )
);

REVOKE ALL ON public.reservation_submissions FROM anon;
GRANT INSERT ON public.reservation_submissions TO anon;
GRANT SELECT, INSERT ON public.reservation_submissions TO authenticated;

-- ─── hospitality_profile_amenities ─────────────────────────────────────────────
ALTER TABLE public.hospitality_profile_amenities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can delete hospitality profile amenities" ON public.hospitality_profile_amenities;
DROP POLICY IF EXISTS "Authenticated users can create hospitality profile amenities" ON public.hospitality_profile_amenities;
DROP POLICY IF EXISTS "Admins can delete hospitality profile amenities" ON public.hospitality_profile_amenities;
DROP POLICY IF EXISTS "Admins can create hospitality profile amenities" ON public.hospitality_profile_amenities;

CREATE POLICY "Admins can delete hospitality profile amenities"
ON public.hospitality_profile_amenities
FOR DELETE
TO authenticated
USING (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

CREATE POLICY "Admins can create hospitality profile amenities"
ON public.hospitality_profile_amenities
FOR INSERT
TO authenticated
WITH CHECK (public.has_permission_level(auth.uid(), 'admin'::public.permission_level));

NOTIFY pgrst, 'reload schema';
