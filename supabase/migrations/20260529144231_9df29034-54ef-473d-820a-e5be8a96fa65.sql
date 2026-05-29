
-- 1. Tighten cm_change_requests coordinator update policy: prevent coordinators from rewriting requester or moving the request to another event
DROP POLICY IF EXISTS "cm_cr_update_coordinator" ON public.cm_change_requests;
CREATE POLICY "cm_cr_update_coordinator"
ON public.cm_change_requests
FOR UPDATE
TO authenticated
USING (
  (EXISTS (SELECT 1 FROM events e WHERE e.id = cm_change_requests.event_id AND e.user_id = auth.uid()))
  OR has_min_permission_level(auth.uid(), 'coordinator'::permission_level, event_id)
  OR has_min_permission_level(auth.uid(), 'coordinator'::permission_level, NULL::uuid)
  OR has_permission_level(auth.uid(), 'admin'::permission_level)
)
WITH CHECK (
  (
    (EXISTS (SELECT 1 FROM events e WHERE e.id = cm_change_requests.event_id AND e.user_id = auth.uid()))
    OR has_min_permission_level(auth.uid(), 'coordinator'::permission_level, event_id)
    OR has_min_permission_level(auth.uid(), 'coordinator'::permission_level, NULL::uuid)
    OR has_permission_level(auth.uid(), 'admin'::permission_level)
  )
  AND requested_by = (SELECT requested_by FROM public.cm_change_requests x WHERE x.id = cm_change_requests.id)
  AND event_id IS NOT DISTINCT FROM (SELECT event_id FROM public.cm_change_requests x WHERE x.id = cm_change_requests.id)
);

-- 2. Remove anon from comment-attachments storage SELECT policy (bucket is private)
DROP POLICY IF EXISTS "Comment attachments viewable by uploader or admin/coordinator" ON storage.objects;
CREATE POLICY "Comment attachments viewable by uploader or admin/coordinator"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'comment-attachments'::text
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR has_min_permission_level(auth.uid(), 'coordinator'::permission_level)
  )
);

-- 3. Tighten rsvp_submissions INSERT to require booking ownership
DROP POLICY IF EXISTS "rsvp_submissions_insert_authenticated_valid_booking" ON public.rsvp_submissions;
CREATE POLICY "rsvp_submissions_insert_owner_only"
ON public.rsvp_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  book_id IS NOT NULL AND book_id <> ''
  AND (
    EXISTS (SELECT 1 FROM "Bookings Directory" bd WHERE bd.book_id = rsvp_submissions.book_id AND bd.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM "Create Event" ce WHERE ce.userid = rsvp_submissions.book_id AND ce.userid = (auth.uid())::text)
  )
);

-- 4. Tighten qrcode_submissions INSERT to require booking ownership
DROP POLICY IF EXISTS "qrcode_submissions_insert_authenticated_valid_booking" ON public.qrcode_submissions;
CREATE POLICY "qrcode_submissions_insert_owner_only"
ON public.qrcode_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  book_id IS NOT NULL AND book_id <> ''
  AND (
    EXISTS (SELECT 1 FROM "Bookings Directory" bd WHERE bd.book_id = qrcode_submissions.book_id AND bd.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM "Create Event" ce WHERE ce.userid = qrcode_submissions.book_id AND ce.userid = (auth.uid())::text)
  )
);

-- 5. Remove public/anon SELECT exposure on directory profile tables (still readable by authenticated users)
DROP POLICY IF EXISTS "Anyone can view entertainment profiles" ON public."Entertainment Profile";
DROP POLICY IF EXISTS "Anyone can view hospitality profiles" ON public."Hospitality Profile";
DROP POLICY IF EXISTS "Anyone can view supplier profiles" ON public."Supplier Profile";

-- 6. Add missing INSERT policy on "User Profile" scoped to owner
CREATE POLICY "own_profile_insert"
ON public."User Profile"
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 7. Restrict role assignment management to admins only (prevent privilege escalation by coordinators)
DROP POLICY IF EXISTS "coordinators_can_insert_roles" ON public.user_roles;
DROP POLICY IF EXISTS "coordinators_can_update_roles" ON public.user_roles;
DROP POLICY IF EXISTS "coordinators_can_delete_roles" ON public.user_roles;
