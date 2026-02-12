
-- Rename table
ALTER TABLE IF EXISTS public.venues RENAME TO venue_profiles;

-- Rename primary key index
ALTER INDEX IF EXISTS venues_pkey RENAME TO venue_profiles_pkey;

-- Rename FK constraints on venue_profiles
DO $$ BEGIN
  ALTER TABLE public.venue_profiles RENAME CONSTRAINT venues_user_id_fkey TO venue_profiles_user_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.venue_profiles RENAME CONSTRAINT venues_venue_type_id_fkey TO venue_profiles_venue_type_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Rename FK constraints on other tables that reference venue_profiles
DO $$ BEGIN
  ALTER TABLE public.reservation_submissions RENAME CONSTRAINT reservation_submissions_venue_id_fkey TO reservation_submissions_venue_profile_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.workflows RENAME CONSTRAINT workflows_venue_id_fkey TO workflows_venue_profile_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Rename trigger
DO $$ BEGIN
  ALTER TRIGGER update_venues_updated_at ON public.venue_profiles RENAME TO update_venue_profiles_updated_at;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Recreate RLS policies with updated names
DROP POLICY IF EXISTS "Anyone can view venues" ON public.venue_profiles;
CREATE POLICY "Anyone can view venue_profiles" ON public.venue_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create venues" ON public.venue_profiles;
CREATE POLICY "Users can create venue_profiles" ON public.venue_profiles FOR INSERT WITH CHECK ((user_id IS NULL) OR (user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own venues" ON public.venue_profiles;
CREATE POLICY "Users can update their own venue_profiles" ON public.venue_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own venues" ON public.venue_profiles;
CREATE POLICY "Users can delete their own venue_profiles" ON public.venue_profiles FOR DELETE USING (user_id = auth.uid());
