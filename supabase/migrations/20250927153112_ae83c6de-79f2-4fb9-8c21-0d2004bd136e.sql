-- Create vendor_rental_types table
CREATE TABLE IF NOT EXISTS public.vendor_rental_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_rental_types ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing vendor_rental_types
DROP POLICY IF EXISTS "Anyone can view vendor rental types" ON public.vendor_rental_types;
CREATE POLICY "Anyone can view vendor rental types"
ON public.vendor_rental_types
FOR SELECT
USING (true);

-- Create serv_vendor_rentals table
CREATE TABLE IF NOT EXISTS public.serv_vendor_rentals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone_number TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.serv_vendor_rentals ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing serv_vendor_rentals
DROP POLICY IF EXISTS "Anyone can view serv vendor rentals" ON public.serv_vendor_rentals;
CREATE POLICY "Anyone can view serv vendor rentals"
ON public.serv_vendor_rentals
FOR SELECT
USING (true);

-- Create linking table for serv_vendor_rentals and vendor_rental_types
CREATE TABLE IF NOT EXISTS public.serv_vendor_rental_types (
  id SERIAL PRIMARY KEY,
  serv_vendor_rental_id UUID REFERENCES public.serv_vendor_rentals(id) ON DELETE CASCADE,
  vendor_rental_type_id INTEGER REFERENCES public.vendor_rental_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(serv_vendor_rental_id, vendor_rental_type_id)
);

-- Enable RLS
ALTER TABLE public.serv_vendor_rental_types ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing the linking table
DROP POLICY IF EXISTS "Anyone can view serv vendor rental types" ON public.serv_vendor_rental_types;
CREATE POLICY "Anyone can view serv vendor rental types"
ON public.serv_vendor_rental_types
FOR SELECT
USING (true);

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_vendor_rental_types_updated_at ON public.vendor_rental_types;
CREATE TRIGGER update_vendor_rental_types_updated_at
BEFORE UPDATE ON public.vendor_rental_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_serv_vendor_rentals_updated_at ON public.serv_vendor_rentals;
CREATE TRIGGER update_serv_vendor_rentals_updated_at
BEFORE UPDATE ON public.serv_vendor_rentals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_serv_vendor_rental_types_updated_at ON public.serv_vendor_rental_types;
CREATE TRIGGER update_serv_vendor_rental_types_updated_at
BEFORE UPDATE ON public.serv_vendor_rental_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();