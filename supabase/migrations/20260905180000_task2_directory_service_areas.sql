-- Task 2: regional coverage is reference data, not a directory listing.
--
-- A service area answers "where can I search?" without fabricating venues or providers.
-- Actual directory results still come exclusively from their respective profile tables.

CREATE TABLE IF NOT EXISTS public.directory_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  directory_key text NOT NULL CHECK (
    directory_key IN (
      'venue',
      'hospitality',
      'service_vendor',
      'service_rental',
      'transportation',
      'entertainment',
      'external_vendor',
      'marketing'
    )
  ),
  state text NOT NULL,
  city text NOT NULL,
  region text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (directory_key, state, city)
);

ALTER TABLE public.directory_service_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read directory service areas" ON public.directory_service_areas;
CREATE POLICY "Authenticated users can read directory service areas"
  ON public.directory_service_areas
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS directory_service_areas_directory_location_idx
  ON public.directory_service_areas (directory_key, state, city)
  WHERE is_active = true;

-- The requested Task 2 regions, plus the existing DMV acceptance-test coverage.
-- These are intentionally service areas only: no fictional business profiles are inserted.
WITH directory_keys(directory_key) AS (
  VALUES
    ('venue'),
    ('hospitality'),
    ('service_vendor'),
    ('service_rental'),
    ('transportation'),
    ('entertainment'),
    ('external_vendor'),
    ('marketing')
),
areas(state, city, region) AS (
  VALUES
    ('DC', 'Washington', 'District of Columbia'),
    ('MD', 'Baltimore', 'Maryland'),
    ('MD', 'Bethesda', 'Maryland'),
    ('MD', 'Silver Spring', 'Maryland'),
    ('VA', 'Alexandria', 'Virginia'),
    ('VA', 'Arlington', 'Virginia'),
    ('VA', 'Tysons', 'Virginia'),
    ('NJ', 'Newark', 'New Jersey'),
    ('NJ', 'Jersey City', 'New Jersey'),
    ('NJ', 'Atlantic City', 'New Jersey'),
    ('DE', 'Wilmington', 'Delaware'),
    ('DE', 'Dover', 'Delaware'),
    ('PA', 'Philadelphia', 'Pennsylvania East'),
    ('PA', 'Allentown', 'Pennsylvania East'),
    ('PA', 'Pittsburgh', 'Pennsylvania West'),
    ('PA', 'Erie', 'Pennsylvania West'),
    ('NY', 'Manhattan', 'NYC Boroughs'),
    ('NY', 'Brooklyn', 'NYC Boroughs'),
    ('NY', 'Queens', 'NYC Boroughs'),
    ('NY', 'Bronx', 'NYC Boroughs'),
    ('NY', 'Staten Island', 'NYC Boroughs'),
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
)
INSERT INTO public.directory_service_areas (directory_key, state, city, region)
SELECT directory_keys.directory_key, areas.state, areas.city, areas.region
FROM directory_keys
CROSS JOIN areas
ON CONFLICT (directory_key, state, city) DO UPDATE
SET region = EXCLUDED.region,
    is_active = true;
