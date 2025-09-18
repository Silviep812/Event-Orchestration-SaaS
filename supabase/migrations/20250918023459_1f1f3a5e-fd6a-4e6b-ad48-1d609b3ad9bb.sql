-- Change start_time and end_time columns to time type in events table
ALTER TABLE public.events 
ALTER COLUMN start_time TYPE time USING start_time::time,
ALTER COLUMN end_time TYPE time USING end_time::time;