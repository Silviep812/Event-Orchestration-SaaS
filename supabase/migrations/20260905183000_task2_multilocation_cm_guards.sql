-- Task 2: protect the event/location/task boundary for multi-location change management.
-- A location-scoped request must never point to a location or task from another event, and an
-- in-use location must remain available for the request/task audit history.

CREATE OR REPLACE FUNCTION public.validate_cm_change_request_location_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  location_event_id uuid;
  task_event_id uuid;
  task_location_id uuid;
BEGIN
  IF NEW.location_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT event_id
    INTO location_event_id
  FROM public.cm_locations
  WHERE id = NEW.location_id;

  IF location_event_id IS NULL THEN
    RAISE EXCEPTION 'Change-request location % does not exist.', NEW.location_id
      USING ERRCODE = '23503';
  END IF;

  IF NEW.event_id IS DISTINCT FROM location_event_id THEN
    RAISE EXCEPTION 'Change-request location must belong to the same event.'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.task_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT event_id, location_id
    INTO task_event_id, task_location_id
  FROM public.tasks
  WHERE id = NEW.task_id;

  IF task_event_id IS NULL THEN
    RAISE EXCEPTION 'Change-request task % does not exist.', NEW.task_id
      USING ERRCODE = '23503';
  END IF;

  IF task_event_id IS DISTINCT FROM NEW.event_id THEN
    RAISE EXCEPTION 'Change-request task must belong to the same event.'
      USING ERRCODE = '23514';
  END IF;

  IF task_location_id IS DISTINCT FROM NEW.location_id THEN
    RAISE EXCEPTION 'Location-scoped change-request task must use the same event location.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_cm_change_request_location_scope ON public.cm_change_requests;
CREATE TRIGGER trg_validate_cm_change_request_location_scope
  BEFORE INSERT OR UPDATE OF event_id, task_id, location_id
  ON public.cm_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cm_change_request_location_scope();

-- The inverse check prevents a later task edit from silently breaking the
-- location boundary already recorded on a linked change request.
CREATE OR REPLACE FUNCTION public.validate_task_change_request_location_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.cm_change_requests cr
    WHERE cr.task_id = NEW.id
      AND cr.location_id IS NOT NULL
      AND (
        cr.event_id IS DISTINCT FROM NEW.event_id
        OR cr.location_id IS DISTINCT FROM NEW.location_id
      )
  ) THEN
    RAISE EXCEPTION 'Task event or location cannot change while it is linked to a location-scoped change request.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_task_change_request_location_scope ON public.tasks;
CREATE TRIGGER trg_validate_task_change_request_location_scope
  BEFORE UPDATE OF event_id, location_id
  ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_task_change_request_location_scope();

CREATE OR REPLACE FUNCTION public.prevent_referenced_cm_location_deletion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.tasks WHERE location_id = OLD.id) THEN
    RAISE EXCEPTION 'This location is assigned to one or more tasks and cannot be deleted.'
      USING ERRCODE = '23503';
  END IF;

  IF EXISTS (SELECT 1 FROM public.cm_change_requests WHERE location_id = OLD.id) THEN
    RAISE EXCEPTION 'This location is referenced by change-request history and cannot be deleted.'
      USING ERRCODE = '23503';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_referenced_cm_location_deletion ON public.cm_locations;
CREATE TRIGGER trg_prevent_referenced_cm_location_deletion
  BEFORE DELETE ON public.cm_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_referenced_cm_location_deletion();
