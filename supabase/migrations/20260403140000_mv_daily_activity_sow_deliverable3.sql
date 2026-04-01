-- Deliverable 3 / Scope of Work: "Materialized view mv_daily_activity refreshes successfully."
-- Daily rollup of cm_activity rows in UTC (for reporting / Activity widgets).

DROP MATERIALIZED VIEW IF EXISTS public.mv_daily_activity CASCADE;

CREATE MATERIALIZED VIEW public.mv_daily_activity AS
SELECT
  ((cm_activity.created_at AT TIME ZONE 'UTC')::date) AS activity_day_utc,
  cm_activity.event_id,
  cm_activity.entity_type,
  count(*)::bigint AS activity_count
FROM public.cm_activity
GROUP BY 1, 2, 3;

CREATE UNIQUE INDEX IF NOT EXISTS mv_daily_activity_day_event_entity_uidx
  ON public.mv_daily_activity (activity_day_utc, event_id, entity_type);

COMMENT ON MATERIALIZED VIEW public.mv_daily_activity IS
  'SOW D3: UTC daily aggregates from cm_activity; refresh via refresh_mv_daily_activity().';

-- Prefer CONCURRENT refresh (needs unique index above).
CREATE OR REPLACE FUNCTION public.refresh_mv_daily_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_daily_activity;
END;
$$;

REVOKE ALL ON TABLE public.mv_daily_activity FROM PUBLIC;
GRANT SELECT ON TABLE public.mv_daily_activity TO service_role;

GRANT EXECUTE ON FUNCTION public.refresh_mv_daily_activity() TO service_role;

-- Optional: owners see only their events' rows (MV itself is not RLS-aware).
CREATE OR REPLACE VIEW public.mv_daily_activity_for_user
WITH (security_invoker = true) AS
SELECT m.*
FROM public.mv_daily_activity m
INNER JOIN public.events e ON e.id = m.event_id AND e.user_id = auth.uid();

GRANT SELECT ON public.mv_daily_activity_for_user TO authenticated;
