-- Task 2 staging acceptance checks: multi-location change management
-- Run after applying 20260905183000_task2_multilocation_cm_guards.sql and completing the
-- manual scenario documented below. Every "Expected: zero rows" query must return no rows.

-- 1. Schema integrity: location-scoped requests always point to a location for their event.
-- Expected: zero rows
SELECT cr.id, cr.event_id AS request_event_id, loc.event_id AS location_event_id
FROM public.cm_change_requests cr
LEFT JOIN public.cm_locations loc ON loc.id = cr.location_id
WHERE cr.location_id IS NOT NULL
  AND (loc.id IS NULL OR loc.event_id IS DISTINCT FROM cr.event_id);

-- 2. Task integrity: location-scoped requests and their linked tasks share event + location.
-- Expected: zero rows
SELECT cr.id, cr.event_id AS request_event_id, cr.location_id AS request_location_id,
       t.event_id AS task_event_id, t.location_id AS task_location_id
FROM public.cm_change_requests cr
JOIN public.tasks t ON t.id = cr.task_id
WHERE cr.location_id IS NOT NULL
  AND (t.event_id IS DISTINCT FROM cr.event_id OR t.location_id IS DISTINCT FROM cr.location_id);

-- 3. Auditability: location-scoped requests retain an identifiable location label.
-- Expected: zero rows
SELECT cr.id, cr.created_at, cr.status
FROM public.cm_change_requests cr
LEFT JOIN public.cm_locations loc ON loc.id = cr.location_id
WHERE cr.location_id IS NOT NULL
  AND COALESCE(NULLIF(btrim(loc.name), ''), '') = '';

-- 4. After a manual approval, replace the interval with the test window.
-- Expected: each approved request has an in-app notification for its requester.
SELECT cr.id AS change_request_id, cr.requested_by, cr.resolved_at
FROM public.cm_change_requests cr
LEFT JOIN public.notifications n
  ON n.entity_type = 'change_request'
 AND n.entity_id = cr.id::text
 AND n.recipient_id = cr.requested_by
 AND n.type = 'change_request_approved'
WHERE cr.location_id IS NOT NULL
  AND cr.status = 'approved'
  AND cr.resolved_at >= now() - interval '1 day'
  AND n.id IS NULL;

-- 5. Expected: each recently resolved request has a successfully sent email audit record.
-- A failed row means email-provider configuration or delivery must be investigated before acceptance.
SELECT cr.id AS change_request_id, cr.status, cr.requested_by, cr.resolved_at
FROM public.cm_change_requests cr
LEFT JOIN public.email_events ee
  ON ee.event_id = cr.event_id
 AND ee.user_id = cr.requested_by
 AND ee.template = 'change_request_status'
 AND ee.status = 'sent'
 AND ee.metadata ->> 'change_request_id' = cr.id::text
 AND ee.metadata ->> 'status' = cr.status
WHERE cr.location_id IS NOT NULL
  AND cr.status IN ('approved', 'rejected')
  AND cr.resolved_at >= now() - interval '1 day'
  AND ee.id IS NULL;

-- Manual staging scenario (run on desktop and mobile):
--   A. As event owner: create one event, then add Location A and Location B in Manage Event.
--   B. As collaborator: submit an urgent request for Location B from Project Management > Collaborator.
--   C. Confirm its linked task is assigned to Location B and the request shows Location B + mobile/desktop origin.
--   D. As owner/coordinator: approve the request. Confirm it becomes approved, keeps Location B,
--      sends an in-app and email notification to the requester, and leaves Location A records unchanged.
--   E. Attempt to delete Location B. Expected: deletion is blocked because it has task/request history.
--   F. As a non-owner/non-coordinator: confirm approve/reject controls are absent and direct update is denied.
