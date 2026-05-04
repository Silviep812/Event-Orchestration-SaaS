-- Milestone 4: IEP Event Orchestration DB revisions (idempotent where practical)
BEGIN;

-- ── 1) public."Authorization" ─────────────────────────────────────────────
ALTER TABLE public."Authorization"
  ADD COLUMN IF NOT EXISTS pass_word text,
  ADD COLUMN IF NOT EXISTS reset_pw text,
  ADD COLUMN IF NOT EXISTS userid text,
  ADD COLUMN IF NOT EXISTS userid_password text;

-- Extend scrub trigger for new secret field (matches existing pattern)
CREATE OR REPLACE FUNCTION public.scrub_authorization_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.pass_word := NULL;
  NEW.create_password := NULL;
  NEW.reset_pw := NULL;
  NEW.userid_password := NULL;
  RETURN NEW;
END;
$$;

-- ── 2) public."Collaborators" (table name is plural in DB) ─────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Collaborators' AND column_name = 'services_assign_to'
  ) THEN
    ALTER TABLE public."Collaborators" RENAME COLUMN services_assign_to TO service_vendor;
  END IF;
END $$;

-- ── 3) public."Comments" → public."Communication Hub" ──────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Comments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view comments" ON public."Comments"';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own comments" ON public."Comments"';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can create comments" ON public."Comments"';
    EXECUTE 'ALTER TABLE public."Comments" RENAME TO "Communication Hub"';
  END IF;
END $$;

ALTER TABLE public."Communication Hub" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view comments" ON public."Communication Hub";
DROP POLICY IF EXISTS "Users can view own comments" ON public."Communication Hub";
DROP POLICY IF EXISTS "Authenticated users can view communication hub" ON public."Communication Hub";
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public."Communication Hub";

CREATE POLICY "Authenticated users can view communication hub"
ON public."Communication Hub"
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create communication hub entries"
ON public."Communication Hub"
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- ── 4) public."Event Plan Report" (mirror event_vend_* pattern) ────────────
ALTER TABLE public."Event Plan Report"
  ADD COLUMN IF NOT EXISTS event_service_rental_buy_biz_name text,
  ADD COLUMN IF NOT EXISTS event_service_rental_buy_collab_name text,
  ADD COLUMN IF NOT EXISTS event_service_rental_buy_contact_name text,
  ADD COLUMN IF NOT EXISTS event_service_rental_buy_contact_nbr numeric,
  ADD COLUMN IF NOT EXISTS event_service_rental_buy_cost public.budget_category,
  ADD COLUMN IF NOT EXISTS event_service_rental_buy_email text,
  ADD COLUMN IF NOT EXISTS event_service_rental_buy_end_date text,
  ADD COLUMN IF NOT EXISTS event_service_rental_buy_location text,
  ADD COLUMN IF NOT EXISTS event_service_rental_buy_start_date text,
  ADD COLUMN IF NOT EXISTS event_service_rental_buy_type text,
  ADD COLUMN IF NOT EXISTS event_service_vendor_biz_name text,
  ADD COLUMN IF NOT EXISTS event_service_vendor_collab_name text,
  ADD COLUMN IF NOT EXISTS event_service_vendor_contact_name text,
  ADD COLUMN IF NOT EXISTS event_service_vendor_contact_nbr numeric,
  ADD COLUMN IF NOT EXISTS event_service_vendor_cost public.budget_category,
  ADD COLUMN IF NOT EXISTS event_service_vendor_email text,
  ADD COLUMN IF NOT EXISTS event_service_vendor_end_date text,
  ADD COLUMN IF NOT EXISTS event_service_vendor_location text,
  ADD COLUMN IF NOT EXISTS event_service_vendor_start_date text,
  ADD COLUMN IF NOT EXISTS event_service_vendor_type text,
  ADD COLUMN IF NOT EXISTS event_supplier_biz_name text,
  ADD COLUMN IF NOT EXISTS event_supplier_collab_name text,
  ADD COLUMN IF NOT EXISTS event_supplier_contact_name text,
  ADD COLUMN IF NOT EXISTS event_supplier_contact_nbr numeric,
  ADD COLUMN IF NOT EXISTS event_supplier_cost public.budget_category,
  ADD COLUMN IF NOT EXISTS event_supplier_email text,
  ADD COLUMN IF NOT EXISTS event_supplier_end_date text,
  ADD COLUMN IF NOT EXISTS event_supplier_location text,
  ADD COLUMN IF NOT EXISTS event_supplier_start_date text,
  ADD COLUMN IF NOT EXISTS event_supplier_type text,
  ADD COLUMN IF NOT EXISTS booking_type text;

-- ── 5) public."Event Resources" ─────────────────────────────────────────────
ALTER TABLE public."Event Resources"
  ADD COLUMN IF NOT EXISTS external_vendor_types_text text;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Event Resources' AND column_name = 'service_rental_type') THEN
    ALTER TABLE public."Event Resources" RENAME COLUMN service_rental_type TO service_rental_buy_type;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Event Resources' AND column_name = 'supply_type') THEN
    ALTER TABLE public."Event Resources" RENAME COLUMN supply_type TO supplier_types;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Event Resources' AND column_name = 'service_vendor_type') THEN
    ALTER TABLE public."Event Resources" RENAME COLUMN service_vendor_type TO service_vendor_types;
  END IF;
END $$;

-- ── 6) public."Manage Event" ────────────────────────────────────────────────
ALTER TABLE public."Manage Event" ADD COLUMN IF NOT EXISTS marketing_type text[];

DO $$
BEGIN
  -- Free name service_vendor_type for rename from service_type
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Manage Event' AND column_name = 'service_vendor_type') THEN
    ALTER TABLE public."Manage Event" RENAME COLUMN service_vendor_type TO service_vendor_types;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Manage Event' AND column_name = 'service_type') THEN
    ALTER TABLE public."Manage Event" RENAME COLUMN service_type TO service_vendor_type;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Manage Event' AND column_name = 'service_biz_name') THEN
    ALTER TABLE public."Manage Event" RENAME COLUMN service_biz_name TO service_vendor_biz_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Manage Event' AND column_name = 'service_cost') THEN
    ALTER TABLE public."Manage Event" RENAME COLUMN service_cost TO service_vendor_cost;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Manage Event' AND column_name = 'service_delivery_date') THEN
    ALTER TABLE public."Manage Event" RENAME COLUMN service_delivery_date TO service_vendor_delivery_date;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Manage Event' AND column_name = 'service_delivery_location') THEN
    ALTER TABLE public."Manage Event" RENAME COLUMN service_delivery_location TO service_vendor_delivery_location;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Manage Event' AND column_name = 'service_delivery_time') THEN
    ALTER TABLE public."Manage Event" RENAME COLUMN service_delivery_time TO service_vendor_delivery_time;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Manage Event' AND column_name = 'service_rental_type') THEN
    ALTER TABLE public."Manage Event" RENAME COLUMN service_rental_type TO service_rental_buy_type;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Manage Event' AND column_name = 'supply_cost') THEN
    ALTER TABLE public."Manage Event" RENAME COLUMN supply_cost TO supplier_cost;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Manage Event' AND column_name = 'supply_delivery_date') THEN
    ALTER TABLE public."Manage Event" RENAME COLUMN supply_delivery_date TO supplier_delivery_date;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Manage Event' AND column_name = 'supply_delivery_time') THEN
    ALTER TABLE public."Manage Event" RENAME COLUMN supply_delivery_time TO supplier_delivery_time;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Manage Event' AND column_name = 'supply_type') THEN
    ALTER TABLE public."Manage Event" RENAME COLUMN supply_type TO supplier_types;
  END IF;
END $$;

-- ── 7) public."Service Profile" → public."Service_Vendor Profile" ──────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'Service Profile' AND c.relkind = 'r') THEN
    ALTER TABLE public."Service Profile" RENAME TO "Service_Vendor Profile";
  END IF;
END $$;

-- Recreate RLS policies on new table name (same rules as hosts)
ALTER TABLE public."Service_Vendor Profile" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view service profiles" ON public."Service_Vendor Profile";
DROP POLICY IF EXISTS "Anyone can view service vendor profiles" ON public."Service_Vendor Profile";
CREATE POLICY "Anyone can view service vendor profiles"
ON public."Service_Vendor Profile" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hosts can insert service profiles" ON public."Service_Vendor Profile";
DROP POLICY IF EXISTS "Hosts can update service profiles" ON public."Service_Vendor Profile";
DROP POLICY IF EXISTS "Hosts can delete service profiles" ON public."Service_Vendor Profile";
DROP POLICY IF EXISTS "Hosts can insert service vendor profiles" ON public."Service_Vendor Profile";
DROP POLICY IF EXISTS "Hosts can update service vendor profiles" ON public."Service_Vendor Profile";
DROP POLICY IF EXISTS "Hosts can delete service vendor profiles" ON public."Service_Vendor Profile";
CREATE POLICY "Hosts can insert service vendor profiles" ON public."Service_Vendor Profile" FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can update service vendor profiles" ON public."Service_Vendor Profile" FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'host'));
CREATE POLICY "Hosts can delete service vendor profiles" ON public."Service_Vendor Profile" FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'host'));

-- ── 8–9) Directory manual-entry text (Service Vendor Directory dropped in §13)
ALTER TABLE public."Vendor Directory" ADD COLUMN IF NOT EXISTS other_manual_text text;
ALTER TABLE public."Supplier Directory" ADD COLUMN IF NOT EXISTS other_manual_text text;

-- ── 10) public."Supplier Profile" ────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Supplier Profile' AND column_name = 'supply_id') THEN
    ALTER TABLE public."Supplier Profile" RENAME COLUMN supply_id TO supplier_id;
  END IF;
END $$;

-- ── 12) public."User Profile" typo ──────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User Profile' AND column_name = 'Subscrition_End_Date') THEN
    ALTER TABLE public."User Profile" RENAME COLUMN "Subscrition_End_Date" TO "Subscription_End_Date";
  END IF;
END $$;

-- ── 11) Consolidate event_themes into Themes Directory product surface ─────
-- Reference copy on the wide Themes Directory row(s) + canonical relational rename.
ALTER TABLE public."Themes Directory" ADD COLUMN IF NOT EXISTS event_themes_catalog jsonb;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_themes') THEN
    UPDATE public."Themes Directory" td
    SET event_themes_catalog = sub.j
    FROM (
      SELECT COALESCE(jsonb_agg(to_jsonb(et) ORDER BY et.id), '[]'::jsonb) AS j
      FROM public.event_themes et
    ) sub
    WHERE td.ctid = (SELECT td2.ctid FROM public."Themes Directory" td2 ORDER BY td2.ctid LIMIT 1);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'event_themes' AND c.relkind = 'r') THEN
    ALTER TABLE public.event_themes RENAME TO "Themes Directory Catalog";
  END IF;
END $$;

ALTER TABLE public."Themes Directory Catalog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view event_themes" ON public."Themes Directory Catalog";
DROP POLICY IF EXISTS "Hosts can insert event themes" ON public."Themes Directory Catalog";
DROP POLICY IF EXISTS "Hosts can update event themes" ON public."Themes Directory Catalog";
DROP POLICY IF EXISTS "Hosts can delete event themes" ON public."Themes Directory Catalog";
DROP POLICY IF EXISTS "Anyone can view event themes" ON public."Themes Directory Catalog";
DROP POLICY IF EXISTS "Admins can manage event themes" ON public."Themes Directory Catalog";

CREATE POLICY "Authenticated users can view themes directory catalog"
ON public."Themes Directory Catalog" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Hosts can insert themes directory catalog"
ON public."Themes Directory Catalog" FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'host'));

CREATE POLICY "Hosts can update themes directory catalog"
ON public."Themes Directory Catalog" FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'host'));

CREATE POLICY "Hosts can delete themes directory catalog"
ON public."Themes Directory Catalog" FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'host'));

-- ── 14–16) serv_vendor_* → vendor / service_rental_buy / assignments ─────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'serv_vendor_suppliers' AND c.relkind = 'r') THEN
    ALTER TABLE public.serv_vendor_suppliers RENAME TO vendor;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'serv_vendor_rentals' AND c.relkind = 'r') THEN
    ALTER TABLE public.serv_vendor_rentals RENAME TO service_rental_buy;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'serv_vendor_rental_assignments' AND c.relkind = 'r') THEN
    ALTER TABLE public.serv_vendor_rental_assignments RENAME TO service_rental_buy_assignments;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_rental_buy_assignments' AND column_name = 'serv_vendor_rental_id') THEN
    ALTER TABLE public.service_rental_buy_assignments RENAME COLUMN serv_vendor_rental_id TO service_rental_buy_id;
  END IF;
END $$;

-- events.rental FK column rename
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'serv_vendor_rental_id') THEN
    ALTER TABLE public.events RENAME COLUMN serv_vendor_rental_id TO service_rental_buy_id;
  END IF;
END $$;

-- workflows rental column rename for clarity (optional FK targets already renamed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'serv_vendor_rent_id') THEN
    ALTER TABLE public.workflows RENAME COLUMN serv_vendor_rent_id TO service_rental_buy_id;
  END IF;
END $$;

-- RLS names on renamed rental tables
ALTER TABLE public.service_rental_buy ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view serv_vendor_rentals" ON public.service_rental_buy;
CREATE POLICY "Authenticated users can view service_rental_buy"
ON public.service_rental_buy FOR SELECT TO authenticated USING (true);

ALTER TABLE public.vendor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view serv_vendor_suppliers" ON public.vendor;
CREATE POLICY "Authenticated users can view vendor"
ON public.vendor FOR SELECT TO authenticated USING (true);

ALTER TABLE public.service_rental_buy_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view serv_vendor_rental_assignments" ON public.service_rental_buy_assignments;
CREATE POLICY "Authenticated users can view service_rental_buy_assignments"
ON public.service_rental_buy_assignments FOR SELECT TO authenticated USING (true);

-- ── 13) Remove duplicate Service Vendor Directory (use Vendor Directory) ───
DROP TABLE IF EXISTS public."Service Vendor Directory" CASCADE;

-- ── 17–18) External vendor directory + profile ─────────────────────────────
CREATE TABLE IF NOT EXISTS public."external_vendor directory" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('Finance', 'Legal')),
  type text NOT NULL CHECK (type IN ('Invoice', 'Receipt', 'Contracts')),
  manual_entry text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."external_vendor profile" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_vendor_directory_id uuid REFERENCES public."external_vendor directory"(id) ON DELETE SET NULL,
  business_name text,
  contact_name text,
  email text,
  phone text,
  notes text,
  manual_entry text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public."external_vendor directory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."external_vendor profile" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view external vendor directory" ON public."external_vendor directory";
CREATE POLICY "Authenticated users can view external vendor directory"
ON public."external_vendor directory" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert external vendor directory" ON public."external_vendor directory";
CREATE POLICY "Authenticated users can insert external vendor directory"
ON public."external_vendor directory" FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view external vendor profile" ON public."external_vendor profile";
CREATE POLICY "Authenticated users can view external vendor profile"
ON public."external_vendor profile" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert external vendor profile" ON public."external_vendor profile";
DROP POLICY IF EXISTS "Authenticated users can insert external_vendor profile" ON public."external_vendor profile";
CREATE POLICY "Authenticated users can insert external vendor profile"
ON public."external_vendor profile" FOR INSERT TO authenticated WITH CHECK (true);

-- Views over public.events expose renamed columns; recreate so SELECT * tracks events.*
DROP VIEW IF EXISTS public.due_soon_events CASCADE;
CREATE VIEW public.due_soon_events
WITH (security_invoker = true) AS
SELECT e.*
FROM public.events e
WHERE e.archived IS NOT TRUE
  AND e.start_date IS NOT NULL
  AND e.start_date::date <= (CURRENT_DATE + 2)
  AND e.start_date::date >= CURRENT_DATE;

REVOKE ALL ON public.due_soon_events FROM anon;
GRANT SELECT ON public.due_soon_events TO authenticated;

DROP TRIGGER IF EXISTS trg_external_vendor_directory_updated_at ON public."external_vendor directory";
CREATE TRIGGER trg_external_vendor_directory_updated_at
BEFORE UPDATE ON public."external_vendor directory"
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_external_vendor_profile_updated_at ON public."external_vendor profile";
CREATE TRIGGER trg_external_vendor_profile_updated_at
BEFORE UPDATE ON public."external_vendor profile"
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
