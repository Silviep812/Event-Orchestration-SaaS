-- Create enum for event statuses (idempotent on replay / remote parity)
DO $$
BEGIN
  CREATE TYPE public.event_status_enum AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Alter the Manage Event table to use the enum
ALTER TABLE public."Manage Event" 
ALTER COLUMN event_status TYPE public.event_status_enum USING event_status::public.event_status_enum;