-- Create venue_types table
CREATE TABLE public.venue_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.venue_types ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing venue types
CREATE POLICY "Anyone can view venue types" 
ON public.venue_types 
FOR SELECT 
USING (true);

-- Create venues table
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone_number TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  capacity INTEGER,
  venue_type_id INTEGER REFERENCES public.venue_types(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing venues
CREATE POLICY "Anyone can view venues" 
ON public.venues 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_venue_types_updated_at
BEFORE UPDATE ON public.venue_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();