-- Deliverable 1 Acceptance Criteria: add 'confirmed' to event_status_enum.
-- ALTER TYPE ... ADD VALUE is idempotent in Postgres 14+ when using IF NOT EXISTS.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'event_status_enum'
      AND e.enumlabel = 'confirmed'
  ) THEN
    ALTER TYPE public.event_status_enum ADD VALUE 'confirmed';
  END IF;
END $$;
