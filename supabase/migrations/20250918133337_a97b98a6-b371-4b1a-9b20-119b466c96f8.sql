-- Create event_types table
CREATE TABLE IF NOT EXISTS public.event_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  theme_id UUID NOT NULL REFERENCES public.event_themes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can view event types" ON public.event_types;
CREATE POLICY "Anyone can view event types" 
ON public.event_types 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can insert event types" ON public.event_types;
CREATE POLICY "Admins can insert event types" 
ON public.event_types 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update event types" ON public.event_types;
CREATE POLICY "Admins can update event types" 
ON public.event_types 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete event types" ON public.event_types;
CREATE POLICY "Admins can delete event types" 
ON public.event_types 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better performance on theme_id lookups
CREATE INDEX IF NOT EXISTS idx_event_types_theme_id ON public.event_types(theme_id);