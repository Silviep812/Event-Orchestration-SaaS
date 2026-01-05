-- Add start_time, end_time, start_date, and end_date columns to tasks_new table
ALTER TABLE tasks_new 
ADD COLUMN start_time text,
ADD COLUMN end_time text,
ADD COLUMN start_date text,
ADD COLUMN end_date text;