-- Create resource_categories lookup table
CREATE TABLE IF NOT EXISTS public.resource_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resource_status lookup table
CREATE TABLE IF NOT EXISTS public.resource_status (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES public.resource_categories(id) ON DELETE SET NULL,
  status_id INTEGER REFERENCES public.resource_status(id) ON DELETE SET NULL,
  location TEXT,
  available INTEGER NOT NULL DEFAULT 0,
  allocated INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resource_categories (public read)
DROP POLICY IF EXISTS "Anyone can view resource categories" ON public.resource_categories;
CREATE POLICY "Anyone can view resource categories"
ON public.resource_categories
FOR SELECT
USING (true);

-- RLS Policies for resource_status (public read)
DROP POLICY IF EXISTS "Anyone can view resource statuses" ON public.resource_status;
CREATE POLICY "Anyone can view resource statuses"
ON public.resource_status
FOR SELECT
USING (true);

-- RLS Policies for resources
DROP POLICY IF EXISTS "Users can view resources for their events" ON public.resources;
CREATE POLICY "Users can view resources for their events"
ON public.resources
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = resources.event_id
    AND events.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create resources for their events" ON public.resources;
CREATE POLICY "Users can create resources for their events"
ON public.resources
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = resources.event_id
    AND events.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update resources for their events" ON public.resources;
CREATE POLICY "Users can update resources for their events"
ON public.resources
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = resources.event_id
    AND events.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete resources for their events" ON public.resources;
CREATE POLICY "Users can delete resources for their events"
ON public.resources
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = resources.event_id
    AND events.user_id = auth.uid()
  )
);

DROP TRIGGER IF EXISTS update_resources_updated_at ON public.resources;
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_resources_event_id ON public.resources(event_id);
CREATE INDEX IF NOT EXISTS idx_resources_category_id ON public.resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_status_id ON public.resources(status_id);

-- Insert some default categories (idempotent)
INSERT INTO public.resource_categories (name)
SELECT v FROM (VALUES
  ('Equipment'),
  ('Personnel'),
  ('Venue'),
  ('Transportation'),
  ('Supplies')
) AS t(v)
WHERE NOT EXISTS (SELECT 1 FROM public.resource_categories c WHERE c.name = t.v);

-- Insert some default statuses (idempotent)
INSERT INTO public.resource_status (name)
SELECT v FROM (VALUES
  ('Available'),
  ('In Use'),
  ('Maintenance'),
  ('Unavailable')
) AS t(v)
WHERE NOT EXISTS (SELECT 1 FROM public.resource_status s WHERE s.name = t.v);
