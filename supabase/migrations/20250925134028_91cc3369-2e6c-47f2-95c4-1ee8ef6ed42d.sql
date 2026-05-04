-- Update final batch of policies

-- Vendor Profile policies
DROP POLICY IF EXISTS "Admins can insert vendor profiles" ON public."Vendor Profile";
DROP POLICY IF EXISTS "Admins can update vendor profiles" ON public."Vendor Profile";
DROP POLICY IF EXISTS "Admins can delete vendor profiles" ON public."Vendor Profile";
CREATE POLICY "Hosts can insert vendor profiles" ON public."Vendor Profile" FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can update vendor profiles" ON public."Vendor Profile" FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can delete vendor profiles" ON public."Vendor Profile" FOR DELETE TO authenticated USING (has_role(auth.uid(), 'host'));

-- Registration policies (table may be absent on remote parity)
DO $$
BEGIN
  IF to_regclass('public."Registration"') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage registration" ON public."Registration"';
    EXECUTE $p$
      CREATE POLICY "Hosts can manage registration" ON public."Registration" FOR ALL TO authenticated
      USING (has_role(auth.uid(), ''host''))
      WITH CHECK (has_role(auth.uid(), ''host''))
    $p$;
  END IF;
END $$;

-- Subscription Plans policies
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public."Subscription_Plans Directory";
CREATE POLICY "Hosts can manage subscription plans" ON public."Subscription_Plans Directory" FOR ALL TO authenticated USING (has_role(auth.uid(), 'host')) WITH CHECK (has_role(auth.uid(), 'host'));

-- Supplier Vendor Profile policies
DROP POLICY IF EXISTS "Admins can manage supplier vendor profiles" ON public."Supplier Vendor Profile";
CREATE POLICY "Hosts can manage supplier vendor profiles" ON public."Supplier Vendor Profile" FOR ALL TO authenticated USING (has_role(auth.uid(), 'host')) WITH CHECK (has_role(auth.uid(), 'host'));

-- Authorization policies
DROP POLICY IF EXISTS "Admins manage Authorization" ON public."Authorization";
DROP POLICY IF EXISTS "Admins update Authorization" ON public."Authorization";
DROP POLICY IF EXISTS "Admins delete Authorization" ON public."Authorization";
CREATE POLICY "Hosts manage Authorization" ON public."Authorization" FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts update Authorization" ON public."Authorization" FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'host')) WITH CHECK (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts delete Authorization" ON public."Authorization" FOR DELETE TO authenticated USING (has_role(auth.uid(), 'host'));

-- User Profile policies
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public."User Profile";
CREATE POLICY "Hosts can view all user profiles" ON public."User Profile" FOR SELECT TO authenticated USING (has_role(auth.uid(), 'host'));

-- Budget items policies
DROP POLICY IF EXISTS "Admins and managers can manage all budget items" ON public.budget_items;
CREATE POLICY "Hosts and organizers can manage all budget items" ON public.budget_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer')) WITH CHECK (has_role(auth.uid(), 'host') OR has_role(auth.uid(), 'organizer'));

-- Event themes policies
DROP POLICY IF EXISTS "Admins can insert event themes" ON public.event_themes;
DROP POLICY IF EXISTS "Admins can update event themes" ON public.event_themes;  
DROP POLICY IF EXISTS "Admins can delete event themes" ON public.event_themes;
CREATE POLICY "Hosts can insert event themes" ON public.event_themes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can update event themes" ON public.event_themes FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can delete event themes" ON public.event_themes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'host'));

-- Event types policies
DROP POLICY IF EXISTS "Admins can insert event types" ON public.event_types;
DROP POLICY IF EXISTS "Admins can update event types" ON public.event_types;
DROP POLICY IF EXISTS "Admins can delete event types" ON public.event_types;
CREATE POLICY "Hosts can insert event types" ON public.event_types FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can update event types" ON public.event_types FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can delete event types" ON public.event_types FOR DELETE TO authenticated USING (has_role(auth.uid(), 'host'));