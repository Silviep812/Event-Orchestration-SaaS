-- Milestone 5: Seed Resource Directory Data for Target States/Regions
-- NJ, DE, PA (East/West), NYC (Boroughs), MA (Boston Area), IL (Chicago Area),
-- GA (Atlanta Metro), FL
BEGIN;

-- ── 1) Add region/state columns to directory tables if missing ───────────────
ALTER TABLE public."Venue Directory" ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public."Venue Directory" ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public."Venue Directory" ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE public."Hospitality Directory" ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public."Hospitality Directory" ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public."Hospitality Directory" ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE public."Vendor Directory" ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public."Vendor Directory" ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public."Vendor Directory" ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE public."Supplier Directory" ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public."Supplier Directory" ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public."Supplier Directory" ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE public."Entertainment Directory" ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public."Entertainment Directory" ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public."Entertainment Directory" ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE public."Transportation Directory" ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public."Transportation Directory" ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public."Transportation Directory" ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE public."Marketing Directory" ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public."Marketing Directory" ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public."Marketing Directory" ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE public."Service Rental/Sale Directory" ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public."Service Rental/Sale Directory" ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public."Service Rental/Sale Directory" ADD COLUMN IF NOT EXISTS region text;

-- ── 2) Seed Venue Directory entries per region ───────────────────────────────
INSERT INTO public."Venue Directory" (state, city, region) VALUES
  ('NJ', 'Newark', 'New Jersey'),
  ('NJ', 'Jersey City', 'New Jersey'),
  ('NJ', 'Atlantic City', 'New Jersey'),
  ('DE', 'Wilmington', 'Delaware'),
  ('DE', 'Dover', 'Delaware'),
  ('PA', 'Philadelphia', 'PA East'),
  ('PA', 'Allentown', 'PA East'),
  ('PA', 'Pittsburgh', 'PA West'),
  ('PA', 'Erie', 'PA West'),
  ('NY', 'Manhattan', 'NYC Borough'),
  ('NY', 'Brooklyn', 'NYC Borough'),
  ('NY', 'Queens', 'NYC Borough'),
  ('NY', 'Bronx', 'NYC Borough'),
  ('NY', 'Staten Island', 'NYC Borough'),
  ('MA', 'Boston', 'Boston Area'),
  ('MA', 'Cambridge', 'Boston Area'),
  ('MA', 'Somerville', 'Boston Area'),
  ('IL', 'Chicago', 'Chicago Area'),
  ('IL', 'Evanston', 'Chicago Area'),
  ('IL', 'Naperville', 'Chicago Area'),
  ('GA', 'Atlanta', 'Atlanta Metro'),
  ('GA', 'Marietta', 'Atlanta Metro'),
  ('GA', 'Decatur', 'Atlanta Metro'),
  ('FL', 'Miami', 'Florida'),
  ('FL', 'Orlando', 'Florida'),
  ('FL', 'Tampa', 'Florida'),
  ('FL', 'Jacksonville', 'Florida')
ON CONFLICT DO NOTHING;

-- ── 3) Seed Hospitality Directory entries per region ─────────────────────────
INSERT INTO public."Hospitality Directory" (state, city, region) VALUES
  ('NJ', 'Newark', 'New Jersey'),
  ('NJ', 'Jersey City', 'New Jersey'),
  ('DE', 'Wilmington', 'Delaware'),
  ('PA', 'Philadelphia', 'PA East'),
  ('PA', 'Pittsburgh', 'PA West'),
  ('NY', 'Manhattan', 'NYC Borough'),
  ('NY', 'Brooklyn', 'NYC Borough'),
  ('NY', 'Queens', 'NYC Borough'),
  ('MA', 'Boston', 'Boston Area'),
  ('IL', 'Chicago', 'Chicago Area'),
  ('GA', 'Atlanta', 'Atlanta Metro'),
  ('FL', 'Miami', 'Florida'),
  ('FL', 'Orlando', 'Florida'),
  ('FL', 'Tampa', 'Florida')
ON CONFLICT DO NOTHING;

-- ── 4) Seed Vendor Directory entries per region ──────────────────────────────
INSERT INTO public."Vendor Directory" (state, city, region) VALUES
  ('NJ', 'Newark', 'New Jersey'),
  ('DE', 'Wilmington', 'Delaware'),
  ('PA', 'Philadelphia', 'PA East'),
  ('PA', 'Pittsburgh', 'PA West'),
  ('NY', 'Manhattan', 'NYC Borough'),
  ('NY', 'Brooklyn', 'NYC Borough'),
  ('MA', 'Boston', 'Boston Area'),
  ('IL', 'Chicago', 'Chicago Area'),
  ('GA', 'Atlanta', 'Atlanta Metro'),
  ('FL', 'Miami', 'Florida'),
  ('FL', 'Orlando', 'Florida')
ON CONFLICT DO NOTHING;

-- ── 5) Seed Supplier Directory entries per region ────────────────────────────
INSERT INTO public."Supplier Directory" (state, city, region) VALUES
  ('NJ', 'Newark', 'New Jersey'),
  ('DE', 'Wilmington', 'Delaware'),
  ('PA', 'Philadelphia', 'PA East'),
  ('PA', 'Pittsburgh', 'PA West'),
  ('NY', 'Manhattan', 'NYC Borough'),
  ('NY', 'Brooklyn', 'NYC Borough'),
  ('MA', 'Boston', 'Boston Area'),
  ('IL', 'Chicago', 'Chicago Area'),
  ('GA', 'Atlanta', 'Atlanta Metro'),
  ('FL', 'Miami', 'Florida'),
  ('FL', 'Orlando', 'Florida')
ON CONFLICT DO NOTHING;

-- ── 6) Seed Entertainment Directory entries per region ───────────────────────
INSERT INTO public."Entertainment Directory" (state, city, region) VALUES
  ('NJ', 'Newark', 'New Jersey'),
  ('DE', 'Wilmington', 'Delaware'),
  ('PA', 'Philadelphia', 'PA East'),
  ('PA', 'Pittsburgh', 'PA West'),
  ('NY', 'Manhattan', 'NYC Borough'),
  ('NY', 'Brooklyn', 'NYC Borough'),
  ('MA', 'Boston', 'Boston Area'),
  ('IL', 'Chicago', 'Chicago Area'),
  ('GA', 'Atlanta', 'Atlanta Metro'),
  ('FL', 'Miami', 'Florida'),
  ('FL', 'Orlando', 'Florida')
ON CONFLICT DO NOTHING;

-- ── 7) Seed Transportation Directory entries per region ──────────────────────
INSERT INTO public."Transportation Directory" (state, city, region) VALUES
  ('NJ', 'Newark', 'New Jersey'),
  ('DE', 'Wilmington', 'Delaware'),
  ('PA', 'Philadelphia', 'PA East'),
  ('PA', 'Pittsburgh', 'PA West'),
  ('NY', 'Manhattan', 'NYC Borough'),
  ('NY', 'Brooklyn', 'NYC Borough'),
  ('MA', 'Boston', 'Boston Area'),
  ('IL', 'Chicago', 'Chicago Area'),
  ('GA', 'Atlanta', 'Atlanta Metro'),
  ('FL', 'Miami', 'Florida'),
  ('FL', 'Orlando', 'Florida')
ON CONFLICT DO NOTHING;

-- ── 8) Indexes for location-based search ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_venue_dir_state ON public."Venue Directory"(state);
CREATE INDEX IF NOT EXISTS idx_venue_dir_region ON public."Venue Directory"(region);
CREATE INDEX IF NOT EXISTS idx_hospitality_dir_state ON public."Hospitality Directory"(state);
CREATE INDEX IF NOT EXISTS idx_vendor_dir_state ON public."Vendor Directory"(state);
CREATE INDEX IF NOT EXISTS idx_supplier_dir_state ON public."Supplier Directory"(state);
CREATE INDEX IF NOT EXISTS idx_entertainment_dir_state ON public."Entertainment Directory"(state);
CREATE INDEX IF NOT EXISTS idx_transportation_dir_state ON public."Transportation Directory"(state);

COMMIT;
