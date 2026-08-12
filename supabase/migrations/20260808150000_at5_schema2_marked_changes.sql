-- IEP_Current_System_Schema2 — the changes the client marked in bold on the printout.
--
-- Every statement is guarded so a table or column that does not exist in this environment is
-- skipped rather than aborting the run. Idempotent and safe to re-run.

-- ---------------------------------------------------------------------------
-- Authorization — "Missing attributes from table: Reset password, magic_link"
--
-- Also relevant to the earlier note that password reset was the problem found
-- when the app was vetted with event planners.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE public."Authorization" ADD COLUMN IF NOT EXISTS reset_password text;
  ALTER TABLE public."Authorization" ADD COLUMN IF NOT EXISTS magic_link text;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Authorization table not present; skipped';
END $$;

-- ---------------------------------------------------------------------------
-- Collaborators — attribute 3 reads "service_vendor + _assign_to"
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Collaborators'
      AND column_name = 'service_vendor +_assign_to'
  ) THEN
    ALTER TABLE public."Collaborators" RENAME COLUMN "service_vendor +_assign_to" TO service_vendor_assign_to;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Collaborators'
      AND column_name = 'service_vendor_assign_to'
  ) THEN
    ALTER TABLE public."Collaborators" ADD COLUMN service_vendor_assign_to text;
  END IF;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Collaborators table not present; skipped';
END $$;

-- ---------------------------------------------------------------------------
-- Hospitality Directory — "Motel - change to Lodge"
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Hospitality Directory' AND column_name = 'Motel'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Hospitality Directory' AND column_name = 'Lodge'
  ) THEN
    ALTER TABLE public."Hospitality Directory" RENAME COLUMN "Motel" TO "Lodge";
  END IF;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Hospitality Directory not present; skipped';
END $$;

-- Hospitality types lookup: rename the Motel row to Lodge where it is stored as data.
DO $$
BEGIN
  UPDATE public.hospitality_types SET name = 'Lodge'
  WHERE lower(btrim(name)) = 'motel'
    AND NOT EXISTS (SELECT 1 FROM public.hospitality_types WHERE lower(btrim(name)) = 'lodge');
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Venue Directory — "ADD: Vineyard/Winery"
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE public."Venue Directory" ADD COLUMN IF NOT EXISTS "Vineyard_Winery" text;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

DO $$
BEGIN
  INSERT INTO public.venue_types (name)
  SELECT 'Vineyard/Winery'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.venue_types WHERE lower(btrim(name)) = 'vineyard/winery'
  );
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Vendor Directory — "Add - Mobile Entertainment", "Add - Support Service",
--                    "Winery - Remove"
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE public."Vendor Directory" ADD COLUMN IF NOT EXISTS "Mobile_Entertainment" text;
  ALTER TABLE public."Vendor Directory" ADD COLUMN IF NOT EXISTS "Support_Service" text[];
  ALTER TABLE public."Vendor Directory" DROP COLUMN IF EXISTS "Winery";
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Same three changes where vendor types are stored as lookup rows.
DO $$
BEGIN
  INSERT INTO public.vendor_supplier_types (name)
  SELECT v.name
  FROM (VALUES ('Mobile Entertainment'), ('Support Service')) AS v(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.vendor_supplier_types existing
    WHERE lower(btrim(existing.name)) = lower(v.name)
  );

  -- Detach any vendor still pointing at Winery before removing the type.
  UPDATE public.vendor SET vendor_sup_type_id = NULL
  WHERE vendor_sup_type_id IN (
    SELECT id FROM public.vendor_supplier_types WHERE lower(btrim(name)) = 'winery'
  );
  DELETE FROM public.vendor_supplier_types WHERE lower(btrim(name)) = 'winery';
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- entertainments — "ADD: FaceBook_url"
-- ---------------------------------------------------------------------------
ALTER TABLE public.entertainments ADD COLUMN IF NOT EXISTS facebook_url text;

-- ---------------------------------------------------------------------------
-- Venue Profile — attribute 3 is misspelled "ven_locatiom"
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Venue Profile' AND column_name = 'ven_locatiom'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Venue Profile' AND column_name = 'ven_location'
  ) THEN
    ALTER TABLE public."Venue Profile" RENAME COLUMN ven_locatiom TO ven_location;
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Service Rental/Sale Directory — 'change "Sale" to "Buy"'
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Service Rental/Sale Directory'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Service Rental/Buy Directory'
  ) THEN
    ALTER TABLE public."Service Rental/Sale Directory" RENAME TO "Service Rental/Buy Directory";
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Subscription_Plans Directory — plan renames
--   Trial → Starter Plan, Standard_Plan → Pro Plan,
--   Premium → BusinessTeam, Premium Plus → One time Use
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  ren RECORD;
BEGIN
  FOR ren IN
    SELECT * FROM (VALUES
      ('Trial',         'Starter Plan'),
      ('Standard_Plan', 'Pro Plan'),
      ('Premium',       'BusinessTeam'),
      ('Premium Plus',  'One time Use')
    ) AS t(old_name, new_name)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Subscription_Plans Directory'
        AND column_name = ren.old_name
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Subscription_Plans Directory'
        AND column_name = ren.new_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I RENAME COLUMN %I TO %I',
        'Subscription_Plans Directory', ren.old_name, ren.new_name
      );
    END IF;
  END LOOP;
END $$;

-- Subscription_Plans Profile — "plan_name - Change to subscriber_name"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Subscription_Plans Profile'
      AND column_name = 'plan_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Subscription_Plans Profile'
      AND column_name = 'subscriber_name'
  ) THEN
    ALTER TABLE public."Subscription_Plans Profile" RENAME COLUMN plan_name TO subscriber_name;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Manage Event — "Add; repeat this pattern for service_rental_buy" and
--                "Insert: service_rental_buy_cost"
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE public."Manage Event" ADD COLUMN IF NOT EXISTS service_rental_buy_delivery_location text;
  ALTER TABLE public."Manage Event" ADD COLUMN IF NOT EXISTS service_rental_buy_delivery_date date;
  ALTER TABLE public."Manage Event" ADD COLUMN IF NOT EXISTS service_rental_buy_delivery_time timestamptz;
  ALTER TABLE public."Manage Event" ADD COLUMN IF NOT EXISTS service_rental_buy_cost numeric;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Create Event — the "+ type" annotations beside the availability booleans
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE public."Create Event" ADD COLUMN IF NOT EXISTS venue_available_type text;
  ALTER TABLE public."Create Event" ADD COLUMN IF NOT EXISTS booking_available_type text;
  ALTER TABLE public."Create Event" ADD COLUMN IF NOT EXISTS supply_available_type text;
  ALTER TABLE public."Create Event" ADD COLUMN IF NOT EXISTS transportation_available_type text;
  ALTER TABLE public."Create Event" ADD COLUMN IF NOT EXISTS service_vendor_available_type text;
  ALTER TABLE public."Create Event" ADD COLUMN IF NOT EXISTS entertainment_available boolean;
  ALTER TABLE public."Create Event" ADD COLUMN IF NOT EXISTS is_service_rental_buy_type_available boolean;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Rename the old service-rental boolean onto the name the printout specifies.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Create Event'
      AND column_name = 'is_service_rental_available'
  ) THEN
    ALTER TABLE public."Create Event" DROP COLUMN IF EXISTS is_service_rental_buy_type_available;
    ALTER TABLE public."Create Event"
      RENAME COLUMN is_service_rental_available TO is_service_rental_buy_type_available;
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;
