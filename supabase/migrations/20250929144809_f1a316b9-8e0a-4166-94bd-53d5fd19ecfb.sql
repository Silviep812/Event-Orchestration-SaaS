-- Drop the existing workflow_types table and recreate with integer id
DROP TABLE IF EXISTS public.workflow_types CASCADE;

-- Create workflow_types table with integer primary key
CREATE TABLE IF NOT EXISTS public.workflow_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workflow_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view workflow types" 
ON public.workflow_types 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create workflow types" 
ON public.workflow_types 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update workflow types" 
ON public.workflow_types 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete workflow types" 
ON public.workflow_types 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_workflow_types_updated_at ON public.workflow_types;
CREATE TRIGGER update_workflow_types_updated_at
BEFORE UPDATE ON public.workflow_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();