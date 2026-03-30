-- Ensure transportation_types + transportations exist (fixes PostgREST:
-- "Could not find the table 'public.transportations' in the schema cache").
-- Safe to re-run. Mirrors legacy migrations 20250927152301 + column adds.

CREATE TABLE IF NOT EXISTS public.transportation_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transportations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone_number TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  capacity INTEGER,
  transp_type_id INTEGER REFERENCES public.transportation_types (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transportations
  ADD COLUMN IF NOT EXISTS seating_capacity INTEGER,
  ADD COLUMN IF NOT EXISTS price NUMERIC,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS special_accommodations TEXT[];

INSERT INTO public.transportation_types (name)
SELECT v.name
FROM (
  VALUES
    ('Bus'),
    ('Van'),
    ('Car/SUV'),
    ('Limousine'),
    ('Truck'),
    ('Other')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM public.transportation_types LIMIT 1);

ALTER TABLE public.transportation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transportations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view transportation types" ON public.transportation_types;
DROP POLICY IF EXISTS "Authenticated users can view transportation_types" ON public.transportation_types;
CREATE POLICY "Authenticated users can view transportation_types"
ON public.transportation_types FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view transportations" ON public.transportations;
DROP POLICY IF EXISTS "Authenticated users can view transportations" ON public.transportations;
CREATE POLICY "Authenticated users can view transportations"
ON public.transportations FOR SELECT TO authenticated USING (true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS update_transportation_types_updated_at ON public.transportation_types;
    CREATE TRIGGER update_transportation_types_updated_at
    BEFORE UPDATE ON public.transportation_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_transportations_updated_at ON public.transportations;
    CREATE TRIGGER update_transportations_updated_at
    BEFORE UPDATE ON public.transportations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
