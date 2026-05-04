-- Create amenity_types table with integer ID
CREATE TABLE IF NOT EXISTS public.amenity_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on amenity_types
ALTER TABLE public.amenity_types ENABLE ROW LEVEL SECURITY;

-- Create policies for amenity_types
DROP POLICY IF EXISTS "Anyone can view amenity types" ON public.amenity_types;
CREATE POLICY "Anyone can view amenity types"
ON public.amenity_types
FOR SELECT
USING (true);

-- Create hospitality_profiles table
CREATE TABLE IF NOT EXISTS public.hospitality_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone_number TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on hospitality_profiles
ALTER TABLE public.hospitality_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for hospitality_profiles
DROP POLICY IF EXISTS "Anyone can view hospitality profiles" ON public.hospitality_profiles;
CREATE POLICY "Anyone can view hospitality profiles"
ON public.hospitality_profiles
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create hospitality profiles" ON public.hospitality_profiles;
CREATE POLICY "Authenticated users can create hospitality profiles"
ON public.hospitality_profiles
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update hospitality profiles" ON public.hospitality_profiles;
CREATE POLICY "Users can update hospitality profiles"
ON public.hospitality_profiles
FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete hospitality profiles" ON public.hospitality_profiles;
CREATE POLICY "Users can delete hospitality profiles"
ON public.hospitality_profiles
FOR DELETE
USING (auth.role() = 'authenticated');

-- Create junction table for hospitality profiles and amenities
CREATE TABLE IF NOT EXISTS public.hospitality_profile_amenities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospitality_profile_id UUID NOT NULL REFERENCES public.hospitality_profiles(id) ON DELETE CASCADE,
  amenity_type_id INTEGER NOT NULL REFERENCES public.amenity_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hospitality_profile_id, amenity_type_id)
);

-- Enable RLS on hospitality_profile_amenities
ALTER TABLE public.hospitality_profile_amenities ENABLE ROW LEVEL SECURITY;

-- Create policies for hospitality_profile_amenities
DROP POLICY IF EXISTS "Anyone can view hospitality profile amenities" ON public.hospitality_profile_amenities;
CREATE POLICY "Anyone can view hospitality profile amenities"
ON public.hospitality_profile_amenities
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create hospitality profile amenities" ON public.hospitality_profile_amenities;
CREATE POLICY "Authenticated users can create hospitality profile amenities"
ON public.hospitality_profile_amenities
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete hospitality profile amenities" ON public.hospitality_profile_amenities;
CREATE POLICY "Authenticated users can delete hospitality profile amenities"
ON public.hospitality_profile_amenities
FOR DELETE
USING (auth.role() = 'authenticated');

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_amenity_types_updated_at ON public.amenity_types;
CREATE TRIGGER update_amenity_types_updated_at
  BEFORE UPDATE ON public.amenity_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_hospitality_profiles_updated_at ON public.hospitality_profiles;
CREATE TRIGGER update_hospitality_profiles_updated_at
  BEFORE UPDATE ON public.hospitality_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hospitality_profiles_business_name ON public.hospitality_profiles(business_name);
CREATE INDEX IF NOT EXISTS idx_hospitality_profiles_city_state ON public.hospitality_profiles(city, state);
CREATE INDEX IF NOT EXISTS idx_hospitality_profile_amenities_profile_id ON public.hospitality_profile_amenities(hospitality_profile_id);
CREATE INDEX IF NOT EXISTS idx_hospitality_profile_amenities_amenity_id ON public.hospitality_profile_amenities(amenity_type_id);