-- Create tasks_dependencies table
CREATE TABLE IF NOT EXISTS public.tasks_dependencies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Enable RLS
ALTER TABLE public.tasks_dependencies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view task dependencies for their events" ON public.tasks_dependencies;
CREATE POLICY "Users can view task dependencies for their events" 
ON public.tasks_dependencies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id 
    AND t.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create task dependencies for their tasks" ON public.tasks_dependencies;
CREATE POLICY "Users can create task dependencies for their tasks" 
ON public.tasks_dependencies 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id 
    AND t.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete task dependencies for their tasks" ON public.tasks_dependencies;
CREATE POLICY "Users can delete task dependencies for their tasks" 
ON public.tasks_dependencies 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id 
    AND t.created_by = auth.uid()
  )
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_dependencies_task_id ON public.tasks_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_dependencies_depends_on ON public.tasks_dependencies(depends_on_task_id);