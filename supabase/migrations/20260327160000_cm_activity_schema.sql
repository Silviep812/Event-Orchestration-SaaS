-- Deliverable 1 Acceptance Criteria:
-- Schema cm_activity created and indexed.
-- Trigger cm_activity.log_event() attached to monitored tables.
-- Trigger downstream updates.

CREATE TABLE IF NOT EXISTS public.cm_activity (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid        REFERENCES public.events(id) ON DELETE CASCADE,
  entity_type  text        NOT NULL,   -- 'event' | 'task' | 'workflow' | 'budget'
  entity_id    uuid,
  action       text        NOT NULL,   -- 'confirmed' | 'updated' | 'created' | 'deleted' | TG_OP value
  changed_by   uuid        REFERENCES auth.users(id),
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cm_activity_event_id   ON public.cm_activity(event_id);
CREATE INDEX IF NOT EXISTS idx_cm_activity_entity_type ON public.cm_activity(entity_type);
CREATE INDEX IF NOT EXISTS idx_cm_activity_created_at  ON public.cm_activity(created_at DESC);

ALTER TABLE public.cm_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can view cm_activity" ON public.cm_activity;
CREATE POLICY "Owner can view cm_activity"
ON public.cm_activity
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = cm_activity.event_id
      AND e.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owner can insert cm_activity" ON public.cm_activity;
CREATE POLICY "Owner can insert cm_activity"
ON public.cm_activity
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = cm_activity.event_id
      AND e.user_id = auth.uid()
  )
);

-- ───────────────────────────────────────────────
-- log_event() trigger function (attached to events)
-- ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cm_activity_log_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Label status changes explicitly
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action := COALESCE(NEW.status::text, 'updated');
    ELSE
      v_action := 'updated';
    END IF;
  ELSE
    v_action := 'deleted';
  END IF;

  INSERT INTO public.cm_activity (
    event_id,
    entity_type,
    entity_id,
    action,
    changed_by,
    metadata
  )
  VALUES (
    COALESCE(NEW.id, OLD.id),
    'event',
    COALESCE(NEW.id, OLD.id),
    v_action,
    auth.uid(),
    jsonb_build_object(
      'title',       COALESCE(NEW.title, OLD.title),
      'status',      COALESCE(NEW.status, OLD.status),
      'old_status',  OLD.status,
      'venue',       COALESCE(NEW.venue, OLD.venue),
      'budget',      COALESCE(NEW.budget, OLD.budget),
      'start_date',  COALESCE(NEW.start_date, OLD.start_date)
    )
  );

  RETURN NEW;
END;
$$;

-- Attach to events table
DROP TRIGGER IF EXISTS cm_activity_events_trigger ON public.events;
CREATE TRIGGER cm_activity_events_trigger
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.cm_activity_log_event();

-- ───────────────────────────────────────────────
-- log_task() trigger function (attached to tasks)
-- ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cm_activity_log_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := CASE
      WHEN OLD.status IS DISTINCT FROM NEW.status THEN COALESCE(NEW.status::text, 'updated')
      ELSE 'updated'
    END;
  ELSE
    v_action := 'deleted';
  END IF;

  INSERT INTO public.cm_activity (
    event_id,
    entity_type,
    entity_id,
    action,
    changed_by,
    metadata
  )
  VALUES (
    COALESCE(NEW.event_id, OLD.event_id),
    'task',
    COALESCE(NEW.id, OLD.id),
    v_action,
    auth.uid(),
    jsonb_build_object(
      'task_title', COALESCE(NEW.title, OLD.title),
      'status',     COALESCE(NEW.status, OLD.status),
      'priority',   COALESCE(NEW.priority, OLD.priority)
    )
  );

  RETURN NEW;
END;
$$;

-- Attach to tasks table
DROP TRIGGER IF EXISTS cm_activity_tasks_trigger ON public.tasks;
CREATE TRIGGER cm_activity_tasks_trigger
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.cm_activity_log_task();

-- Downstream: expose cm_activity as a view joining event title for easy query
CREATE OR REPLACE VIEW public.cm_activity_with_event AS
SELECT
  a.id,
  a.event_id,
  e.title AS event_title,
  a.entity_type,
  a.entity_id,
  a.action,
  a.changed_by,
  a.metadata,
  a.created_at
FROM public.cm_activity a
LEFT JOIN public.events e ON e.id = a.event_id;

GRANT SELECT ON public.cm_activity_with_event TO authenticated;
