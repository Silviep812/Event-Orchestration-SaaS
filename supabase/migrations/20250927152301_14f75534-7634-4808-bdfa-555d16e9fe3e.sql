-- Create transportation_types table
CREATE TABLE IF NOT EXISTS public.transportation_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transportation_types ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing transportation_types
CREATE POLICY "Anyone can view transportation types" 
ON public.transportation_types 
FOR SELECT 
USING (true);

-- Create transportations table
CREATE TABLE IF NOT EXISTS public.transportations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone_number TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  capacity INTEGER,
  transp_type_id INTEGER REFERENCES public.transportation_types(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transportations ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing transportations
CREATE POLICY "Anyone can view transportations" 
ON public.transportations 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_transportation_types_updated_at ON public.transportation_types;
CREATE TRIGGER update_transportation_types_updated_at
BEFORE UPDATE ON public.transportation_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transportations_updated_at ON public.transportations;
CREATE TRIGGER update_transportations_updated_at
BEFORE UPDATE ON public.transportations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();