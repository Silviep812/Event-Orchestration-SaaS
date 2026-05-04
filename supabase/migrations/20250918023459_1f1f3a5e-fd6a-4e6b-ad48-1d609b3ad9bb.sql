-- Change start_time and end_time columns to time type in events table
-- Idempotent: skip if already time; drop views over events first (e.g. due_soon_events uses e.*).

DO $mig$
DECLARE
  st text;
  et text;
BEGIN
  SELECT c.data_type INTO st
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'events' AND c.column_name = 'start_time';

  SELECT c.data_type INTO et
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = 'events' AND c.column_name = 'end_time';

  IF st IS NULL OR et IS NULL THEN
    RETURN;
  END IF;

  IF st = 'time without time zone' AND et = 'time without time zone' THEN
    RETURN;
  END IF;

  EXECUTE 'DROP VIEW IF EXISTS public.due_soon_events CASCADE';

  ALTER TABLE public.events
    ALTER COLUMN start_time TYPE time USING start_time::time,
    ALTER COLUMN end_time TYPE time USING end_time::time;
END $mig$;
