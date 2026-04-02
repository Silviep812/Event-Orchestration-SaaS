-- Fix 2: Add ownership checks to submission table INSERT policies

-- RSVP submissions
DROP POLICY IF EXISTS "rsvp_submissions_insert_authenticated_valid_booking" ON public.rsvp_submissions;
CREATE POLICY "rsvp_submissions_insert_owner_only"
ON public.rsvp_submissions FOR INSERT TO authenticated
WITH CHECK (
  book_id IS NOT NULL AND book_id <> '' AND (
    EXISTS (
      SELECT 1 FROM "Bookings Directory" bd
      WHERE bd.book_id = rsvp_submissions.book_id
        AND bd.user_id = auth.uid()
    )
  )
);

-- Confirmation submissions
DROP POLICY IF EXISTS "Users can submit confirmations for valid bookings" ON public.confirmation_submissions;
CREATE POLICY "confirmation_submissions_insert_owner_only"
ON public.confirmation_submissions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Bookings Directory" bd
    WHERE bd.book_id = confirmation_submissions.book_id
      AND bd.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM "Create Event" ce
    WHERE ce.userid = confirmation_submissions.book_id
      AND ce.userid = auth.uid()::text
  )
);

-- Reservation submissions
DROP POLICY IF EXISTS "Users can submit reservations for valid bookings" ON public.reservation_submissions;
CREATE POLICY "reservation_submissions_insert_owner_only"
ON public.reservation_submissions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Bookings Directory" bd
    WHERE bd.book_id = reservation_submissions.book_id
      AND bd.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM "Create Event" ce
    WHERE ce.userid = reservation_submissions.book_id
      AND ce.userid = auth.uid()::text
  )
);

-- Registry submissions
DROP POLICY IF EXISTS "Users can submit registry for valid bookings" ON public.registry_submissions;
CREATE POLICY "registry_submissions_insert_owner_only"
ON public.registry_submissions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Bookings Directory" bd
    WHERE bd.book_id = registry_submissions.book_id
      AND bd.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM "Create Event" ce
    WHERE ce.userid = registry_submissions.book_id
      AND ce.userid = auth.uid()::text
  )
);

-- QR Code submissions
DROP POLICY IF EXISTS "qrcode_submissions_insert_authenticated_valid_booking" ON public.qrcode_submissions;
CREATE POLICY "qrcode_submissions_insert_owner_only"
ON public.qrcode_submissions FOR INSERT TO authenticated
WITH CHECK (
  book_id IS NOT NULL AND book_id <> '' AND (
    EXISTS (
      SELECT 1 FROM "Bookings Directory" bd
      WHERE bd.book_id = qrcode_submissions.book_id
        AND bd.user_id = auth.uid()
    )
  )
);