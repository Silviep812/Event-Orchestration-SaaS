-- Create hospitality types table
CREATE TABLE IF NOT EXISTS public.hospitality_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hospitality_types ENABLE ROW LEVEL SECURITY;

-- Create policy for public viewing
DROP POLICY IF EXISTS "Anyone can view hospitality types" ON public.hospitality_types;
CREATE POLICY "Anyone can view hospitality types" 
ON public.hospitality_types 
FOR SELECT 
USING (true);

-- Create trigger for updating timestamps
DROP TRIGGER IF EXISTS update_hospitality_types_updated_at ON public.hospitality_types;
CREATE TRIGGER update_hospitality_types_updated_at
BEFORE UPDATE ON public.hospitality_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();