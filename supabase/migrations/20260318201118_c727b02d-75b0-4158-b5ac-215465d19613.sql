
-- 1. Fix submission INSERT policies: validate that the book_id references a real booking
-- rsvp_submissions
DROP POLICY IF EXISTS "Authenticated users can create rsvp submissions" ON public.rsvp_submissions;
CREATE POLICY "Users can submit RSVP for valid bookings"
ON public.rsvp_submissions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public."Bookings Directory" bd WHERE bd.book_id = rsvp_submissions.book_id)
  OR EXISTS (SELECT 1 FROM public."Create Event" ce WHERE ce.userid = rsvp_submissions.book_id)
);

-- qrcode_submissions
DROP POLICY IF EXISTS "Authenticated users can create qrcode submissions" ON public.qrcode_submissions;
CREATE POLICY "Users can submit QR codes for valid bookings"
ON public.qrcode_submissions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public."Bookings Directory" bd WHERE bd.book_id = qrcode_submissions.book_id)
  OR EXISTS (SELECT 1 FROM public."Create Event" ce WHERE ce.userid = qrcode_submissions.book_id)
);

-- confirmation_submissions
DROP POLICY IF EXISTS "Authenticated users can create confirmation submissions" ON public.confirmation_submissions;
CREATE POLICY "Users can submit confirmations for valid bookings"
ON public.confirmation_submissions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public."Bookings Directory" bd WHERE bd.book_id = confirmation_submissions.book_id)
  OR EXISTS (SELECT 1 FROM public."Create Event" ce WHERE ce.userid = confirmation_submissions.book_id)
);

-- registry_submissions
DROP POLICY IF EXISTS "Authenticated users can create registry submissions" ON public.registry_submissions;
CREATE POLICY "Users can submit registry for valid bookings"
ON public.registry_submissions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public."Bookings Directory" bd WHERE bd.book_id = registry_submissions.book_id)
  OR EXISTS (SELECT 1 FROM public."Create Event" ce WHERE ce.userid = registry_submissions.book_id)
);

-- reservation_submissions
DROP POLICY IF EXISTS "Authenticated users can create reservation submissions" ON public.reservation_submissions;
CREATE POLICY "Users can submit reservations for valid bookings"
ON public.reservation_submissions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public."Bookings Directory" bd WHERE bd.book_id = reservation_submissions.book_id)
  OR EXISTS (SELECT 1 FROM public."Create Event" ce WHERE ce.userid = reservation_submissions.book_id)
);

-- 2. Add avatar storage RLS policies
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');
