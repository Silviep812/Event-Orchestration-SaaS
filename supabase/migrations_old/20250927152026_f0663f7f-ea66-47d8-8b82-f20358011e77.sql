-- Create vendor_supplier_types table
CREATE TABLE public.vendor_supplier_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_supplier_types ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing vendor_supplier_types
CREATE POLICY "Anyone can view vendor supplier types" 
ON public.vendor_supplier_types 
FOR SELECT 
USING (true);

-- Create serv_vendor_suppliers table
CREATE TABLE public.serv_vendor_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone_number TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  vendor_sup_type_id INTEGER REFERENCES public.vendor_supplier_types(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.serv_vendor_suppliers ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing serv_vendor_suppliers
CREATE POLICY "Anyone can view serv vendor suppliers" 
ON public.serv_vendor_suppliers 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vendor_supplier_types_updated_at
BEFORE UPDATE ON public.vendor_supplier_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_serv_vendor_suppliers_updated_at
BEFORE UPDATE ON public.serv_vendor_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();