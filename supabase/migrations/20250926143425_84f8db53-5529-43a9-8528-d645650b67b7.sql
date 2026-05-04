-- Create supplier_types lookup table
CREATE TABLE IF NOT EXISTS public.supplier_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_categories lookup table  
CREATE TABLE IF NOT EXISTS public.supplier_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers main table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone_number TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  type_id INTEGER REFERENCES public.supplier_types(id),
  category_id INTEGER REFERENCES public.supplier_categories(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraints
  CONSTRAINT unique_business_email UNIQUE (business_name, email)
);

-- Insert predefined supplier types
INSERT INTO public.supplier_types (name) VALUES 
  ('party_supplies'),
  ('decorations'),
  ('flower_and_plants'),
  ('linens_and_fabrics'),
  ('catering_supplies'),
  ('event_furniture')
ON CONFLICT (name) DO NOTHING;

-- Insert predefined supplier categories
INSERT INTO public.supplier_categories (name) VALUES 
  ('online'),
  ('wholesaler'),
  ('distributor'),
  ('merchandizer')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.supplier_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supplier_types (read-only for authenticated users)
DROP POLICY IF EXISTS "Anyone can view supplier types" ON public.supplier_types;
CREATE POLICY "Anyone can view supplier types" 
ON public.supplier_types 
FOR SELECT 
USING (true);

-- RLS Policies for supplier_categories (read-only for authenticated users)
DROP POLICY IF EXISTS "Anyone can view supplier categories" ON public.supplier_categories;
CREATE POLICY "Anyone can view supplier categories" 
ON public.supplier_categories 
FOR SELECT 
USING (true);

-- RLS Policies for suppliers
DROP POLICY IF EXISTS "Anyone can view suppliers" ON public.suppliers;
CREATE POLICY "Anyone can view suppliers" 
ON public.suppliers 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can create suppliers" 
ON public.suppliers 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can update suppliers" 
ON public.suppliers 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can delete suppliers" 
ON public.suppliers 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_type_id ON public.suppliers(type_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_category_id ON public.suppliers(category_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_business_name ON public.suppliers(business_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON public.suppliers(email);