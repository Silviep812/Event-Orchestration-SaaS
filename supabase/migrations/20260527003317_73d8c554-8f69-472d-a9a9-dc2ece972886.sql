
-- 1. Authorization: drop credential columns
ALTER TABLE public."Authorization" DROP COLUMN IF EXISTS userid_password;
ALTER TABLE public."Authorization" DROP COLUMN IF EXISTS pass_word;
ALTER TABLE public."Authorization" DROP COLUMN IF EXISTS reset_pw;

-- 2. barcode_submissions: remove public policies, add owner-scoped ones
DROP POLICY IF EXISTS "Anyone can view barcode submissions" ON public.barcode_submissions;
DROP POLICY IF EXISTS "Anyone can create barcode submissions" ON public.barcode_submissions;

CREATE POLICY "Book/event owners can view barcode submissions"
ON public.barcode_submissions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public."Bookings Directory" bd
          WHERE bd.book_id = barcode_submissions.book_id AND bd.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public."Create Event" ce
             WHERE ce.userid = barcode_submissions.book_id AND ce.userid = (auth.uid())::text)
);

CREATE POLICY "Owners can insert barcode submissions"
ON public.barcode_submissions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public."Bookings Directory" bd
          WHERE bd.book_id = barcode_submissions.book_id AND bd.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public."Create Event" ce
             WHERE ce.userid = barcode_submissions.book_id AND ce.userid = (auth.uid())::text)
);

-- 3. confirmation_submissions: remove public read
DROP POLICY IF EXISTS "Anyone can view confirmation submissions" ON public.confirmation_submissions;

CREATE POLICY "Book/event owners can view confirmation submissions"
ON public.confirmation_submissions FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public."Bookings Directory" bd
          WHERE bd.book_id = confirmation_submissions.book_id AND bd.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public."Create Event" ce
             WHERE ce.userid = confirmation_submissions.book_id AND ce.userid = (auth.uid())::text)
);

-- 4. profiles: drop blanket read
DROP POLICY IF EXISTS "Users can view all profiles for assignments" ON public.profiles;

-- 5. registry_submissions: drop public read
DROP POLICY IF EXISTS "Anyone can view registry submissions" ON public.registry_submissions;

-- 6. reservation_submissions: drop public insert
DROP POLICY IF EXISTS "Anyone can create reservation submissions" ON public.reservation_submissions;

-- 7. rsvp_submissions: drop public read
DROP POLICY IF EXISTS "Anyone can view RSVP submissions" ON public.rsvp_submissions;

-- 8. user_roles: drop bootstrap and select-all
DROP POLICY IF EXISTS "Bootstrap: Allow role assignment for non-admin users" ON public.user_roles;
DROP POLICY IF EXISTS "Bootstrap: Allow role updates for non-admin users" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_all" ON public.user_roles;
