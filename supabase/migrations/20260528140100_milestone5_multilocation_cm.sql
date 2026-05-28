-- Milestone 5: Multi-Location Change Management
-- Extends CM module to support multiple event locations in change requests.
-- Adds device_info for mobile/desktop tracking per the CM bundle spec.
BEGIN;

-- ── 1) Extend cm_change_requests with location + device info ─────────────────
ALTER TABLE public.cm_change_requests
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.cm_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS device_info jsonb,
  ADD COLUMN IF NOT EXISTS requested_estimate_minutes integer,
  ADD COLUMN IF NOT EXISTS change_type text;

-- ── 2) Extend cm_locations with region metadata ─────────────────────────────
ALTER TABLE public.cm_locations
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS zip text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ── 3) Add location_id to tasks for multi-location assignment ────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.cm_locations(id) ON DELETE SET NULL;

-- ── 4) Index for location-based queries ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cm_cr_location ON public.cm_change_requests(location_id);
CREATE INDEX IF NOT EXISTS idx_tasks_location ON public.tasks(location_id);
CREATE INDEX IF NOT EXISTS idx_cm_locations_event ON public.cm_locations(event_id);

-- ── 5) RLS on cm_locations (ensure authenticated can CRUD for their events) ──
ALTER TABLE public.cm_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cm_locations_select_event_member" ON public.cm_locations;
CREATE POLICY "cm_locations_select_event_member" ON public.cm_locations
  FOR SELECT TO authenticated
  USING (
    event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
    OR event_id IN (SELECT event_id FROM public.cm_event_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "cm_locations_insert_event_owner" ON public.cm_locations;
CREATE POLICY "cm_locations_insert_event_owner" ON public.cm_locations
  FOR INSERT TO authenticated
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "cm_locations_update_event_owner" ON public.cm_locations;
CREATE POLICY "cm_locations_update_event_owner" ON public.cm_locations
  FOR UPDATE TO authenticated
  USING (
    event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "cm_locations_delete_event_owner" ON public.cm_locations;
CREATE POLICY "cm_locations_delete_event_owner" ON public.cm_locations
  FOR DELETE TO authenticated
  USING (
    event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
  );

-- ── 6) Function: apply multi-location change request with downstream task shift
CREATE OR REPLACE FUNCTION public.apply_multilocation_change_request(
  cr_id uuid,
  acting_user uuid
) RETURNS void AS $$
DECLARE
  cr record;
  old_estimate int;
  delta int;
BEGIN
  SELECT * INTO cr FROM public.cm_change_requests WHERE id = cr_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Change request % not found', cr_id;
  END IF;

  IF cr.status NOT IN ('approved', 'accepted') THEN
    RAISE EXCEPTION 'Change request % status is not approved (%).', cr_id, cr.status;
  END IF;

  IF cr.change_type = 'estimate_update' AND cr.task_id IS NOT NULL AND cr.requested_estimate_minutes IS NOT NULL THEN
    SELECT COALESCE(estimated_hours, 60) INTO old_estimate FROM public.tasks WHERE id = cr.task_id;
    delta := cr.requested_estimate_minutes - COALESCE(old_estimate, 60);

    UPDATE public.tasks
    SET estimated_hours = cr.requested_estimate_minutes,
        updated_at = now()
    WHERE id = cr.task_id;

    IF delta <> 0 THEN
      UPDATE public.tasks t
      SET due_date = (t.due_date::timestamptz + (interval '1 minute' * delta))::text,
          updated_at = now()
      WHERE t.event_id = cr.event_id
        AND t.id <> cr.task_id
        AND t.due_date IS NOT NULL
        AND t.due_date::timestamptz >= (
          SELECT due_date::timestamptz FROM public.tasks WHERE id = cr.task_id
        );
    END IF;
  END IF;

  UPDATE public.cm_change_requests
  SET resolved_by = acting_user::text,
      resolved_at = now()
  WHERE id = cr_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

COMMIT;
