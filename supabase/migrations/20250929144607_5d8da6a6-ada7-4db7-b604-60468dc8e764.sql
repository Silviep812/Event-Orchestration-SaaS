-- Create workflow_types table
CREATE TABLE IF NOT EXISTS public.workflow_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workflow_types ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can view workflow types" ON public.workflow_types;
CREATE POLICY "Anyone can view workflow types"
ON public.workflow_types
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create workflow types" ON public.workflow_types;
CREATE POLICY "Authenticated users can create workflow types"
ON public.workflow_types
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update workflow types" ON public.workflow_types;
CREATE POLICY "Authenticated users can update workflow types"
ON public.workflow_types
FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete workflow types" ON public.workflow_types;
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