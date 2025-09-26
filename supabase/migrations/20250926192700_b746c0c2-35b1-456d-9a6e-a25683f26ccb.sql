-- Remove hospitality_type column from hospitality_profile_amenities table
ALTER TABLE public.hospitality_profile_amenities 
DROP COLUMN hospitality_type;

-- Add hospitality_type column to hospitality_profiles table
ALTER TABLE public."Hospitality Profile" 
ADD COLUMN hospitality_type INTEGER REFERENCES public.hospitality_types(id) ON DELETE SET NULL;