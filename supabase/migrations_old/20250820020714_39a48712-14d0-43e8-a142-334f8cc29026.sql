-- Correct policy syntax and enable RLS on uncovered tables

-- Enable RLS where missing
ALTER TABLE public."Registration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Subscription_Plans Directory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Supplier Vendor Profile" ENABLE ROW LEVEL SECURITY;

-- Registration policies
DROP POLICY IF EXISTS "Authenticated users can access registration" ON public."Registration";
DROP POLICY IF EXISTS "Admins can manage registration" ON public."Registration";

CREATE POLICY "Authenticated users can read registration"
ON public."Registration"
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert registration"
ON public."Registration"
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage registration"
ON public."Registration"
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Subscription Plans policies
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public."Subscription_Plans Directory";
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public."Subscription_Plans Directory";

CREATE POLICY "Anyone can view subscription plans"
ON public."Subscription_Plans Directory"
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage subscription plans"
ON public."Subscription_Plans Directory"
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Supplier Vendor Profile policies
DROP POLICY IF EXISTS "Anyone can view supplier vendor profiles" ON public."Supplier Vendor Profile";
DROP POLICY IF EXISTS "Admins can manage supplier vendor profiles" ON public."Supplier Vendor Profile";

CREATE POLICY "Anyone can view supplier vendor profiles"
ON public."Supplier Vendor Profile"
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage supplier vendor profiles"
ON public."Supplier Vendor Profile"
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
