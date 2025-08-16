-- Fix remaining RLS tables without policies - only tables that actually exist

-- A) Check and secure Transportation Profile table
ALTER TABLE public."Transportation Profile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transportation profiles"
ON public."Transportation Profile"
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert transportation profiles"
ON public."Transportation Profile"
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update transportation profiles"
ON public."Transportation Profile"
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete transportation profiles"
ON public."Transportation Profile"
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- B) Check and secure Vendor Profile table
ALTER TABLE public."Vendor Profile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vendor profiles"
ON public."Vendor Profile"
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert vendor profiles"
ON public."Vendor Profile"
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update vendor profiles"
ON public."Vendor Profile"
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete vendor profiles"
ON public."Vendor Profile"
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));