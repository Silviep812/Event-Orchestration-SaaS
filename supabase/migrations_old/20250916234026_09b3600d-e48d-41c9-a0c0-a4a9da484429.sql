-- Add start_time and end_time fields to the events table
ALTER TABLE public.events 
ADD COLUMN start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;