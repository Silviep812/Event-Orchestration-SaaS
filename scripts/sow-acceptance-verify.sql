-- SOW acceptance checks — run in Supabase SQL Editor (Dashboard → SQL).
-- Safe read-only except the explicit RPC refresh calls (needed to prove "runs without error").

-- ─── 1) Objects exist (Deliverable 2 & 3) ───────────────────────────────────
SELECT EXISTS (
  SELECT 1 FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'workflow_analytics_refresh_all'
) AS has_workflow_analytics_refresh_all;

SELECT EXISTS (
  SELECT 1 FROM pg_matviews WHERE schemaname = 'workflow_analytics' AND matviewname = 'event_task_metrics'
) AS has_workflow_analytics_event_task_metrics;

SELECT EXISTS (
  SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'mv_daily_activity'
) AS has_mv_daily_activity;

SELECT EXISTS (
  SELECT 1 FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'refresh_mv_daily_activity'
) AS has_refresh_mv_daily_activity;

SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'cm_activity'
) AS has_cm_activity;

SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'email_events'
) AS has_email_events;

-- ─── 2) RPC: workflow MV refresh (service / dashboard automation) ───────────
-- Uses SECURITY DEFINER chain; run as DB owner in SQL Editor → should succeed.
SELECT public.workflow_analytics_refresh_all() AS workflow_analytics_refresh_ok;

-- ─── 3) RPC: daily activity MV refresh (Deliverable 3) ───────────────────────
SELECT public.refresh_mv_daily_activity() AS mv_daily_activity_refresh_ok;

-- ─── 4) Row counts (sanity) ─────────────────────────────────────────────────
SELECT count(*) AS workflow_event_task_metrics_rows
FROM workflow_analytics.event_task_metrics;

SELECT count(*) AS mv_daily_activity_rows
FROM public.mv_daily_activity;

-- ─── 5) Recent email audit trail (Resend must be valid for status = sent) ───
SELECT template, status, count(*) AS n
FROM public.email_events
WHERE created_at > now() - interval '7 days'
GROUP BY template, status
ORDER BY template, status;
