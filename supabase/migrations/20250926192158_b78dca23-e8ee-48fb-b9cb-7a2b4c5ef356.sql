-- Add hospitality_type column to hospitality_profile_amenities table
ALTER TABLE public.hospitality_profile_amenities 
ADD COLUMN hospitality_type INTEGER REFERENCES public.hospitality_types(id) ON DELETE SET NULL;