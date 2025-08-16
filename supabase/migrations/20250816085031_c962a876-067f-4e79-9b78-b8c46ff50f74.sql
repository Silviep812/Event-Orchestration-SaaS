-- Harden remaining tables and fix linter warnings

-- A) Enable RLS + Policies for business profile tables
-- 1) Entertainment Profile
ALTER TABLE public."Entertainment Profile" ENABLE ROW LEVEL SECURITY;

-- Anyone can view entertainment profiles (public directory data)
CREATE POLICY "Anyone can view entertainment profiles"
ON public."Entertainment Profile"
FOR SELECT
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert entertainment profiles"
ON public."Entertainment Profile"
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update entertainment profiles"
ON public."Entertainment Profile"
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete entertainment profiles"
ON public."Entertainment Profile"
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Hospitality Profile
ALTER TABLE public."Hospitality Profile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hospitality profiles"
ON public."Hospitality Profile"
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert hospitality profiles"
ON public."Hospitality Profile"
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update hospitality profiles"
ON public."Hospitality Profile"
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete hospitality profiles"
ON public."Hospitality Profile"
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Service Profile
ALTER TABLE public."Service Profile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service profiles"
ON public."Service Profile"
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert service profiles"
ON public."Service Profile"
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update service profiles"
ON public."Service Profile"
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete service profiles"
ON public."Service Profile"
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) Supplier Profile
ALTER TABLE public."Supplier Profile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view supplier profiles"
ON public."Supplier Profile"
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert supplier profiles"
ON public."Supplier Profile"
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update supplier profiles"
ON public."Supplier Profile"
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete supplier profiles"
ON public."Supplier Profile"
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5) Venue Profile
ALTER TABLE public."Venue Profile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view venue profiles"
ON public."Venue Profile"
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert venue profiles"
ON public."Venue Profile"
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update venue profiles"
ON public."Venue Profile"
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete venue profiles"
ON public."Venue Profile"
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));


-- B) Set function search_path to 'public' to satisfy linter
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.sync_create_event_to_manage_event() SET search_path = public;
ALTER FUNCTION public.log_change(text, uuid, text, text, text, text, text) SET search_path = public;
ALTER FUNCTION public.notify_coordinators(text, text, text, text, uuid) SET search_path = public;
ALTER FUNCTION public.handle_task_estimate_change() SET search_path = public;
ALTER FUNCTION public.recalculate_project_timeline(uuid) SET search_path = public;