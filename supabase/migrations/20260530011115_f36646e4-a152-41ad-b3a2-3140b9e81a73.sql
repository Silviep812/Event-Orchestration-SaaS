ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS resource_assignments JSONB DEFAULT NULL;

NOTIFY pgrst, 'reload schema';