-- Fix remaining security linter warnings

-- 1) Fix Function Search Path issues - secure existing functions
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_directory_safe()
RETURNS TABLE(userid uuid, user_name text, contact_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT u.userid, u.user_name, u.contact_name
  FROM public."User" u
  WHERE has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'event_manager');
$$;

-- 2) Add RLS policies for tables that have RLS enabled but no policies

-- Registration table - simple authenticated access
CREATE POLICY "Authenticated users can access registration"
ON public."Registration"
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Subscription Plans Directory - public read access
CREATE POLICY "Anyone can view subscription plans"
ON public."Subscription_Plans Directory"
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage subscription plans"
ON public."Subscription_Plans Directory"
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Supplier Vendor Profile - admin management, public view
CREATE POLICY "Anyone can view supplier vendor profiles"
ON public."Supplier Vendor Profile"
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage supplier vendor profiles"
ON public."Supplier Vendor Profile"
FOR INSERT, UPDATE, DELETE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));