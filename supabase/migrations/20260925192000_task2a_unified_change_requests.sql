-- Task 2A: unified_change_requests, the one unified_* view the Manager Dashboard doc
-- references but that was never created.
--
-- Change_Management_Manager_Dashboard_Overview.pdf section 4 opens with:
--   SELECT priority_tag, COUNT(*) FROM unified_change_requests GROUP BY priority_tag;
-- That query could not run: unified_tasks, unified_resources, unified_audit_events and
-- unified_locations all exist, but this one does not.
--
-- Unlike the other unified_* views (which read cm_* only), this one unions both change
-- request tables. The legacy public.change_requests holds 67 rows against
-- cm_change_requests' 5, so a manager dashboard reading cm_* alone would under-report
-- by more than 90% and silently misrepresent the event history.
--
-- Column reconciliation between the two tables:
--   * event_id is text in the legacy table and uuid in cm_. All 67 legacy values were
--     verified to be well-formed uuids, so the cast below cannot fail on current data.
--   * status/priority/change_type are enums in the legacy table and text in cm_, so both
--     sides are cast to text for a stable, comparable output type.
--   * The legacy priority column carries the same meaning as cm_'s priority_tag and is
--     exposed under that name so the dashboard query in the doc works unchanged.
--   * Columns that exist on only one side (location_id, rollout_timing, title,
--     rejection_reason) are surfaced as NULL for the side that lacks them, so the view
--     keeps one stable shape.

CREATE OR REPLACE VIEW public.unified_change_requests AS
SELECT
  'cm'::text                AS source,
  cr.id,
  cr.event_id,
  cr.task_id,
  cr.location_id,
  NULL::text                AS title,
  cr.description,
  cr.priority_tag,
  cr.status::text           AS status,
  cr.change_type::text      AS change_type,
  cr.field_changed,
  cr.old_value,
  cr.new_value,
  cr.rollout_timing,
  cr.requested_by,
  cr.resolved_by,
  cr.resolved_at,
  NULL::text                AS rejection_reason,
  cr.created_at
FROM public.cm_change_requests cr

UNION ALL

SELECT
  'legacy'::text            AS source,
  lr.id,
  lr.event_id::uuid         AS event_id,
  lr.task_id,
  NULL::uuid                AS location_id,
  lr.title,
  lr.description,
  lr.priority::text         AS priority_tag,
  lr.status::text           AS status,
  lr.change_type::text      AS change_type,
  NULL::text                AS field_changed,
  NULL::text                AS old_value,
  NULL::text                AS new_value,
  NULL::text                AS rollout_timing,
  lr.requested_by,
  lr.approved_by            AS resolved_by,
  lr.approved_at            AS resolved_at,
  lr.rejection_reason,
  lr.created_at
FROM public.change_requests lr;

COMMENT ON VIEW public.unified_change_requests IS
  'Manager Dashboard feed: unions cm_change_requests with the legacy change_requests table. '
  'source distinguishes the origin. Reading cm_change_requests alone under-reports history.';

-- Views run with the privileges of their owner, so scope access explicitly rather than
-- relying on the underlying tables' RLS: a caller may only see requests for events they
-- own or collaborate on. security_invoker keeps the base-table RLS in force for the caller.
ALTER VIEW public.unified_change_requests SET (security_invoker = on);

GRANT SELECT ON public.unified_change_requests TO authenticated;
