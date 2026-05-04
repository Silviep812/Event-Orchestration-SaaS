-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_role TEXT CHECK (assigned_role IN ('event_manager', 'vendor_coordinator', 'budget_manager', 'task_coordinator')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  due_date TIMESTAMP WITH TIME ZONE,
  event_id UUID REFERENCES public.events(id),
  created_by UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view tasks they created or are assigned to" 
ON public.tasks 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create tasks for their events" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() AND
  (event_id IS NULL OR event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid()))
);

CREATE POLICY "Task creators and assignees can update tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR
  event_id IN (SELECT id FROM public.events WHERE user_id = auth.uid())
);

CREATE POLICY "Task creators can delete tasks" 
ON public.tasks 
FOR DELETE 
USING (created_by = auth.uid());

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();