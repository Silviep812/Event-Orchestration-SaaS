-- Create template_tasks table
CREATE TABLE IF NOT EXISTS public.template_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.template_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
DROP POLICY IF EXISTS "Users can view their own template tasks" ON public.template_tasks;
CREATE POLICY "Users can view their own template tasks"
ON public.template_tasks
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own template tasks" ON public.template_tasks;
CREATE POLICY "Users can create their own template tasks"
ON public.template_tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own template tasks" ON public.template_tasks;
CREATE POLICY "Users can update their own template tasks"
ON public.template_tasks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own template tasks" ON public.template_tasks;
CREATE POLICY "Users can delete their own template tasks"
ON public.template_tasks
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_template_tasks_updated_at ON public.template_tasks;
CREATE TRIGGER update_template_tasks_updated_at
BEFORE UPDATE ON public.template_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();