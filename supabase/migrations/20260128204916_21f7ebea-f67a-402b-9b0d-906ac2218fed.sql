-- Add resource_assignments JSONB column to tasks table
-- This will store the enhanced resource assignment data with status and confirmation
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS resource_assignments JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN public.tasks.resource_assignments IS 'Stores resource category assignments with status and confirmation. Format: {"Bookings": {"status": "confirmed", "confirmed": true}, "Venues": {"status": "pending", "confirmed": false}}';