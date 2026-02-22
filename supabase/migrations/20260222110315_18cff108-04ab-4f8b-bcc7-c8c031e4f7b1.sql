
-- Add social links and rating to venue_profiles
ALTER TABLE public.venue_profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0;

-- Add social links and rating to serv_vendor_suppliers
ALTER TABLE public.serv_vendor_suppliers
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0;

-- Add social links and rating to suppliers
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0;

-- Add social links and rating to hospitality_profiles
ALTER TABLE public.hospitality_profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0;

-- Add social links and rating to entertainment_profiles
ALTER TABLE public.entertainment_profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0;
