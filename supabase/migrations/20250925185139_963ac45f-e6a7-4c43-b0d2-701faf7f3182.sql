-- Create task_assignments table for role-based task assignments
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  assigned_role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(task_id, assigned_role)
);

-- Enable RLS
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for task_assignments
CREATE POLICY "Users can view task assignments for their tasks" 
ON public.task_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_assignments.task_id 
    AND t.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create task assignments for their tasks" 
ON public.task_assignments 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_assignments.task_id 
    AND t.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update task assignments for their tasks" 
ON public.task_assignments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_assignments.task_id 
    AND t.created_by = auth.uid()
  )
)
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_assignments.task_id 
    AND t.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete task assignments for their tasks" 
ON public.task_assignments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_assignments.task_id 
    AND t.created_by = auth.uid()
  )
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_role ON public.task_assignments(assigned_role);