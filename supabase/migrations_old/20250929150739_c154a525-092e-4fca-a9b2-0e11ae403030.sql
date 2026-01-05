-- Create workflows table with references only to existing tables
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type_id INTEGER REFERENCES public.workflow_types(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workflows" 
ON public.workflows 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own workflows" 
ON public.workflows 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workflows" 
ON public.workflows 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workflows" 
ON public.workflows 
FOR DELETE 
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON public.workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();