-- Rename tasks table to tasks_old and tasks_new to tasks
ALTER TABLE public.tasks RENAME TO tasks_old;
ALTER TABLE public.tasks_new RENAME TO tasks;