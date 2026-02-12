
-- Rename table
ALTER TABLE IF EXISTS public.entertainments RENAME TO entertainment_profiles;

-- Rename primary key index
ALTER INDEX IF EXISTS entertainments_pkey RENAME TO entertainment_profiles_pkey;

-- Rename FK constraint
DO $$ BEGIN
  ALTER TABLE public.entertainment_profiles RENAME CONSTRAINT entertainments_ent_type_id_fkey TO entertainment_profiles_ent_type_id_fkey;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Rename trigger
DO $$ BEGIN
  ALTER TRIGGER update_entertainments_updated_at ON public.entertainment_profiles RENAME TO update_entertainment_profiles_updated_at;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Recreate RLS policy with updated name
DROP POLICY IF EXISTS "Anyone can view entertainments" ON public.entertainment_profiles;
CREATE POLICY "Anyone can view entertainment_profiles" ON public.entertainment_profiles FOR SELECT USING (true);
