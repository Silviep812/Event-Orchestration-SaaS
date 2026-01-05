-- Add event_id column to workflows table
ALTER TABLE public.workflows
ADD COLUMN event_id uuid REFERENCES public.events(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_workflows_event_id ON public.workflows(event_id);