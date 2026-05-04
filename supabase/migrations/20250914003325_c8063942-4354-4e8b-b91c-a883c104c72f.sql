-- Create tasks_new table with similar structure to tasks
CREATE TABLE IF NOT EXISTS public.tasks_new (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID,
    assigned_hosp_role app_role,
    status task_status DEFAULT 'not_started',
    priority task_priority NOT NULL DEFAULT 'medium',
    estimated_hours NUMERIC,
    actual_hours NUMERIC,
    due_date TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_venue_role TEXT,
    assigned_supplier_vendor_role TEXT,
    assigned_service_vendor_role TEXT,
    assined_vendor_role TEXT
);

-- Enable Row Level Security
ALTER TABLE public.tasks_new ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks_new table
CREATE POLICY "Users can view their own tasks" 
ON public.tasks_new 
FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create their own tasks" 
ON public.tasks_new 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own tasks" 
ON public.tasks_new 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own tasks" 
ON public.tasks_new 
FOR DELETE 
USING (created_by = auth.uid());

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_tasks_new_updated_at ON public.tasks_new;
CREATE TRIGGER update_tasks_new_updated_at
BEFORE UPDATE ON public.tasks_new
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();