-- Update all profile table policies and remaining policies

-- Entertainment Profile policies
DROP POLICY IF EXISTS "Admins can insert entertainment profiles" ON public."Entertainment Profile";
DROP POLICY IF EXISTS "Admins can update entertainment profiles" ON public."Entertainment Profile";
DROP POLICY IF EXISTS "Admins can delete entertainment profiles" ON public."Entertainment Profile";
CREATE POLICY "Hosts can insert entertainment profiles" ON public."Entertainment Profile" FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can update entertainment profiles" ON public."Entertainment Profile" FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can delete entertainment profiles" ON public."Entertainment Profile" FOR DELETE TO authenticated USING (has_role(auth.uid(), 'host'));

-- Hospitality Profile policies
DROP POLICY IF EXISTS "Admins can insert hospitality profiles" ON public."Hospitality Profile";
DROP POLICY IF EXISTS "Admins can update hospitality profiles" ON public."Hospitality Profile";
DROP POLICY IF EXISTS "Admins can delete hospitality profiles" ON public."Hospitality Profile";
CREATE POLICY "Hosts can insert hospitality profiles" ON public."Hospitality Profile" FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can update hospitality profiles" ON public."Hospitality Profile" FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can delete hospitality profiles" ON public."Hospitality Profile" FOR DELETE TO authenticated USING (has_role(auth.uid(), 'host'));

-- Service Profile policies  
DROP POLICY IF EXISTS "Admins can insert service profiles" ON public."Service Profile";
DROP POLICY IF EXISTS "Admins can update service profiles" ON public."Service Profile";
DROP POLICY IF EXISTS "Admins can delete service profiles" ON public."Service Profile";
CREATE POLICY "Hosts can insert service profiles" ON public."Service Profile" FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can update service profiles" ON public."Service Profile" FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can delete service profiles" ON public."Service Profile" FOR DELETE TO authenticated USING (has_role(auth.uid(), 'host'));

-- Supplier Profile policies
DROP POLICY IF EXISTS "Admins can insert supplier profiles" ON public."Supplier Profile";
DROP POLICY IF EXISTS "Admins can update supplier profiles" ON public."Supplier Profile";
DROP POLICY IF EXISTS "Admins can delete supplier profiles" ON public."Supplier Profile";
CREATE POLICY "Hosts can insert supplier profiles" ON public."Supplier Profile" FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can update supplier profiles" ON public."Supplier Profile" FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can delete supplier profiles" ON public."Supplier Profile" FOR DELETE TO authenticated USING (has_role(auth.uid(), 'host'));

-- Venue Profile policies (assuming this table exists)
DROP POLICY IF EXISTS "Admins can insert venue profiles" ON public."Venue Profile";
DROP POLICY IF EXISTS "Admins can update venue profiles" ON public."Venue Profile";
DROP POLICY IF EXISTS "Admins can delete venue profiles" ON public."Venue Profile";

-- Transportation Profile policies
DROP POLICY IF EXISTS "Admins can insert transportation profiles" ON public."Transportation Profile";
DROP POLICY IF EXISTS "Admins can update transportation profiles" ON public."Transportation Profile";
DROP POLICY IF EXISTS "Admins can delete transportation profiles" ON public."Transportation Profile";
CREATE POLICY "Hosts can insert transportation profiles" ON public."Transportation Profile" FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can update transportation profiles" ON public."Transportation Profile" FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can delete transportation profiles" ON public."Transportation Profile" FOR DELETE TO authenticated USING (has_role(auth.uid(), 'host'));