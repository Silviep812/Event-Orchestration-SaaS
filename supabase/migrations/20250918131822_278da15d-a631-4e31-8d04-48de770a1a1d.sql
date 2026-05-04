-- Create event_themes table
CREATE TABLE IF NOT EXISTS public.event_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.event_themes ENABLE ROW LEVEL SECURITY;

-- Create policies for event_themes (allow all authenticated users to view themes)
DROP POLICY IF EXISTS "Anyone can view event themes" ON public.event_themes;
CREATE POLICY "Anyone can view event themes" 
ON public.event_themes 
FOR SELECT 
USING (true);

-- Admins can manage themes
DROP POLICY IF EXISTS "Admins can insert event themes" ON public.event_themes;
CREATE POLICY "Admins can insert event themes" 
ON public.event_themes 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update event themes" ON public.event_themes;
CREATE POLICY "Admins can update event themes" 
ON public.event_themes 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete event themes" ON public.event_themes;
CREATE POLICY "Admins can delete event themes" 
ON public.event_themes 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add theme_id column to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES public.event_themes(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_events_theme_id ON public.events(theme_id);