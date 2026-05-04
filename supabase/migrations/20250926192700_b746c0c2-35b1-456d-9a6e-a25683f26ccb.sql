-- Remove hospitality_type column from hospitality_profile_amenities table
ALTER TABLE public.hospitality_profile_amenities
DROP COLUMN IF EXISTS hospitality_type;

-- Add hospitality_type column to hospitality_profiles table
ALTER TABLE public."Hospitality Profile"
ADD COLUMN IF NOT EXISTS hospitality_type INTEGER REFERENCES public.hospitality_types(id) ON DELETE SET NULL;