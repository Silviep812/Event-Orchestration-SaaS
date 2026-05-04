-- Add hospitality_type column to hospitality_profiles table
ALTER TABLE public.hospitality_profiles
ADD COLUMN IF NOT EXISTS hospitality_type INTEGER REFERENCES public.hospitality_types(id) ON DELETE SET NULL;