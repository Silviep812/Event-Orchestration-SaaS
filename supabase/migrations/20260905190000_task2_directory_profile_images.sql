-- Task 2: a consistent optional cover image for every live resource directory.
-- Existing venue/inventory image columns remain readable by the UI for backward compatibility.

ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.hospitality_profiles ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.vendor ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.service_rental_buy ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.transportations ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.entertainments ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS profile_image_url text;

COMMENT ON COLUMN public.venues.profile_image_url IS 'Publicly reachable cover image for the directory profile.';
COMMENT ON COLUMN public.hospitality_profiles.profile_image_url IS 'Publicly reachable cover image for the directory profile.';
COMMENT ON COLUMN public.vendor.profile_image_url IS 'Publicly reachable cover image for the directory profile.';
COMMENT ON COLUMN public.service_rental_buy.profile_image_url IS 'Publicly reachable cover image for the directory profile.';
COMMENT ON COLUMN public.transportations.profile_image_url IS 'Publicly reachable cover image for the directory profile.';
COMMENT ON COLUMN public.entertainments.profile_image_url IS 'Publicly reachable cover image for the directory profile.';
COMMENT ON COLUMN public.suppliers.profile_image_url IS 'Publicly reachable cover image for the directory profile.';
