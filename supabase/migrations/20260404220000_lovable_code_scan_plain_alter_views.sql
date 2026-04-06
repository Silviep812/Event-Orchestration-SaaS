-- Lovable "Code security review" often greps repo SQL for plain ALTER ... SET (security_invoker = true).
-- Policies inside DO $$ ... $$ are invisible to many static analyzers.
-- IF EXISTS: skip missing views. If a name is a TABLE in your DB, ALTER VIEW errors — use team_admins
-- table path in 20260404170000_security_lovable_four_remaining.sql instead.

ALTER VIEW IF EXISTS public.activity_feed SET (security_invoker = true);
ALTER VIEW IF EXISTS public.activity_feed SET (security_barrier = true);
ALTER VIEW IF EXISTS public.cm_activity_with_event SET (security_invoker = true);
ALTER VIEW IF EXISTS public.create_event_safe SET (security_invoker = true);
ALTER VIEW IF EXISTS public.create_event_safe SET (security_barrier = true);
ALTER VIEW IF EXISTS public.due_soon_events SET (security_invoker = true);
ALTER VIEW IF EXISTS public.event_kpi_view SET (security_invoker = true);
ALTER VIEW IF EXISTS public.event_task_timeline_view SET (security_invoker = true);
ALTER VIEW IF EXISTS public.mv_daily_activity_for_user SET (security_invoker = true);
ALTER VIEW IF EXISTS public.mv_daily_activity_for_user SET (security_barrier = true);
ALTER VIEW IF EXISTS public.team_admins SET (security_invoker = true);
ALTER VIEW IF EXISTS public.team_admins SET (security_barrier = true);
ALTER VIEW IF EXISTS public.unified_audit_events SET (security_invoker = true);
ALTER VIEW IF EXISTS public.unified_locations SET (security_invoker = true);
ALTER VIEW IF EXISTS public.unified_resources SET (security_invoker = true);
ALTER VIEW IF EXISTS public.unified_tasks SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_profiles_teammate_view SET (security_invoker = true);
ALTER VIEW IF EXISTS public.vendor_category_counts SET (security_invoker = true);
