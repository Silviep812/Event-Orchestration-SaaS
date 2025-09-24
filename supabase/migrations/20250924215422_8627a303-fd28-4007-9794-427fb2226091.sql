-- Create enum for event statuses
CREATE TYPE event_status_enum AS ENUM (
  'pending',
  'in_progress', 
  'completed',
  'cancelled'
);

-- Alter the Manage Event table to use the enum
ALTER TABLE public."Manage Event" 
ALTER COLUMN event_status TYPE event_status_enum USING event_status::event_status_enum;