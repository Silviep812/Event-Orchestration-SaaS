CREATE TABLE IF NOT EXISTS public.directory_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  directory_key text NOT NULL CHECK (
    directory_key IN (
      'venue','hospitality','service_vendor','service_rental',
      'transportation','entertainment','external_vendor','marketing'
    )
  ),
  state text NOT NULL,
  city text NOT NULL,
  region text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (directory_key, state, city)
);

GRANT SELECT ON public.directory_service_areas TO authenticated;
GRANT ALL ON public.directory_service_areas TO service_role;

ALTER TABLE public.directory_service_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read directory service areas" ON public.directory_service_areas;
CREATE POLICY "Authenticated users can read directory service areas"
  ON public.directory_service_areas
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS directory_service_areas_directory_location_idx
  ON public.directory_service_areas (directory_key, state, city)
  WHERE is_active = true;

WITH directory_keys(directory_key) AS (
  VALUES ('venue'),('hospitality'),('service_vendor'),('service_rental'),
         ('transportation'),('entertainment'),('external_vendor'),('marketing')
),
areas(state, city, region) AS (
  VALUES
    ('DC','Washington','District of Columbia'),
    ('MD','Baltimore','Maryland'),
    ('MD','Bethesda','Maryland'),
    ('MD','Silver Spring','Maryland'),
    ('VA','Alexandria','Virginia'),
    ('VA','Arlington','Virginia'),
    ('VA','Tysons','Virginia'),
    ('NJ','Newark','New Jersey'),
    ('NJ','Jersey City','New Jersey'),
    ('NJ','Atlantic City','New Jersey'),
    ('DE','Wilmington','Delaware'),
    ('DE','Dover','Delaware'),
    ('PA','Philadelphia','Pennsylvania East'),
    ('PA','Allentown','Pennsylvania East'),
    ('PA','Pittsburgh','Pennsylvania West'),
    ('PA','Erie','Pennsylvania West'),
    ('NY','Manhattan','NYC Boroughs'),
    ('NY','Brooklyn','NYC Boroughs'),
    ('NY','Queens','NYC Boroughs'),
    ('NY','Bronx','NYC Boroughs'),
    ('NY','Staten Island','NYC Boroughs'),
    ('MA','Boston','Boston Area'),
    ('MA','Cambridge','Boston Area'),
    ('MA','Somerville','Boston Area'),
    ('IL','Chicago','Chicago Area'),
    ('IL','Evanston','Chicago Area'),
    ('IL','Naperville','Chicago Area'),
    ('GA','Atlanta','Atlanta Metro'),
    ('GA','Marietta','Atlanta Metro'),
    ('GA','Decatur','Atlanta Metro'),
    ('FL','Miami','Florida'),
    ('FL','Orlando','Florida'),
    ('FL','Tampa','Florida'),
    ('FL','Jacksonville','Florida')
)
INSERT INTO public.directory_service_areas (directory_key, state, city, region)
SELECT directory_keys.directory_key, areas.state, areas.city, areas.region
FROM directory_keys CROSS JOIN areas
ON CONFLICT (directory_key, state, city) DO UPDATE
SET region = EXCLUDED.region, is_active = true;

ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.hospitality_profiles ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.vendor ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.service_rental_buy ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.transportations ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.entertainments ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS profile_image_url text;

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

  SELECT event_id INTO location_event_id FROM public.cm_locations WHERE id = NEW.location_id;

  IF location_event_id IS NULL THEN
    RAISE EXCEPTION 'Change-request location % does not exist.', NEW.location_id USING ERRCODE = '23503';
  END IF;

  IF NEW.event_id IS DISTINCT FROM location_event_id THEN
    RAISE EXCEPTION 'Change-request location must belong to the same event.' USING ERRCODE = '23514';
  END IF;

  IF NEW.task_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT event_id, location_id INTO task_event_id, task_location_id FROM public.tasks WHERE id = NEW.task_id;

  IF task_event_id IS NULL THEN
    RAISE EXCEPTION 'Change-request task % does not exist.', NEW.task_id USING ERRCODE = '23503';
  END IF;

  IF task_event_id IS DISTINCT FROM NEW.event_id THEN
    RAISE EXCEPTION 'Change-request task must belong to the same event.' USING ERRCODE = '23514';
  END IF;

  IF task_location_id IS DISTINCT FROM NEW.location_id THEN
    RAISE EXCEPTION 'Location-scoped change-request task must use the same event location.' USING ERRCODE = '23514';
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

CREATE OR REPLACE FUNCTION public.validate_task_change_request_location_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.cm_change_requests cr
    WHERE cr.task_id = NEW.id
      AND cr.location_id IS NOT NULL
      AND (cr.event_id IS DISTINCT FROM NEW.event_id OR cr.location_id IS DISTINCT FROM NEW.location_id)
  ) THEN
    RAISE EXCEPTION 'Task event or location cannot change while it is linked to a location-scoped change request.' USING ERRCODE = '23514';
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
    RAISE EXCEPTION 'This location is assigned to one or more tasks and cannot be deleted.' USING ERRCODE = '23503';
  END IF;

  IF EXISTS (SELECT 1 FROM public.cm_change_requests WHERE location_id = OLD.id) THEN
    RAISE EXCEPTION 'This location is referenced by change-request history and cannot be deleted.' USING ERRCODE = '23503';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_referenced_cm_location_deletion ON public.cm_locations;
CREATE TRIGGER trg_prevent_referenced_cm_location_deletion
  BEFORE DELETE ON public.cm_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_referenced_cm_location_deletion();