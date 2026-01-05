-- Change column types in tasks_new table
ALTER TABLE public.tasks_new 
ALTER COLUMN start_time TYPE time USING start_time::time,
ALTER COLUMN end_time TYPE time USING end_time::time,
ALTER COLUMN start_date TYPE date USING start_date::date,
ALTER COLUMN end_date TYPE date USING end_date::date;