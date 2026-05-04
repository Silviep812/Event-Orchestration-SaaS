-- Create entertainment_types table
CREATE TABLE IF NOT EXISTS public.entertainment_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.entertainment_types ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing entertainment_types
DROP POLICY IF EXISTS "Anyone can view entertainment types" ON public.entertainment_types;
CREATE POLICY "Anyone can view entertainment types"
ON public.entertainment_types
FOR SELECT
USING (true);

-- Create entertainments table
CREATE TABLE IF NOT EXISTS public.entertainments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone_number TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  ent_type_id INTEGER REFERENCES public.entertainment_types(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.entertainments ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing entertainments
DROP POLICY IF EXISTS "Anyone can view entertainments" ON public.entertainments;
CREATE POLICY "Anyone can view entertainments"
ON public.entertainments
FOR SELECT
USING (true);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_entertainment_types_updated_at ON public.entertainment_types;
CREATE TRIGGER update_entertainment_types_updated_at
BEFORE UPDATE ON public.entertainment_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_entertainments_updated_at ON public.entertainments;
CREATE TRIGGER update_entertainments_updated_at
BEFORE UPDATE ON public.entertainments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();