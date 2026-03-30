-- Deliverable 1 fix: grant SELECT to authenticated users on all directory/lookup tables.
-- These are vendor directory tables — all logged-in users must be able to read them.
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS.

-- ── transportations ─────────────────────────────────────────────────────────
ALTER TABLE public.transportations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view transportations" ON public.transportations;
CREATE POLICY "Authenticated users can view transportations"
ON public.transportations FOR SELECT TO authenticated USING (true);

-- ── transportation_types ─────────────────────────────────────────────────────
ALTER TABLE public.transportation_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view transportation_types" ON public.transportation_types;
CREATE POLICY "Authenticated users can view transportation_types"
ON public.transportation_types FOR SELECT TO authenticated USING (true);

-- ── entertainments ───────────────────────────────────────────────────────────
ALTER TABLE public.entertainments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view entertainments" ON public.entertainments;
CREATE POLICY "Authenticated users can view entertainments"
ON public.entertainments FOR SELECT TO authenticated USING (true);

-- ── entertainment_types ──────────────────────────────────────────────────────
ALTER TABLE public.entertainment_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view entertainment_types" ON public.entertainment_types;
CREATE POLICY "Authenticated users can view entertainment_types"
ON public.entertainment_types FOR SELECT TO authenticated USING (true);

-- ── serv_vendor_rentals ──────────────────────────────────────────────────────
ALTER TABLE public.serv_vendor_rentals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view serv_vendor_rentals" ON public.serv_vendor_rentals;
CREATE POLICY "Authenticated users can view serv_vendor_rentals"
ON public.serv_vendor_rentals FOR SELECT TO authenticated USING (true);

-- ── serv_vendor_suppliers ────────────────────────────────────────────────────
ALTER TABLE public.serv_vendor_suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view serv_vendor_suppliers" ON public.serv_vendor_suppliers;
CREATE POLICY "Authenticated users can view serv_vendor_suppliers"
ON public.serv_vendor_suppliers FOR SELECT TO authenticated USING (true);

-- ── vendor_rental_types ──────────────────────────────────────────────────────
ALTER TABLE public.vendor_rental_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view vendor_rental_types" ON public.vendor_rental_types;
CREATE POLICY "Authenticated users can view vendor_rental_types"
ON public.vendor_rental_types FOR SELECT TO authenticated USING (true);

-- ── supplier_types ───────────────────────────────────────────────────────────
ALTER TABLE public.supplier_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view supplier_types" ON public.supplier_types;
CREATE POLICY "Authenticated users can view supplier_types"
ON public.supplier_types FOR SELECT TO authenticated USING (true);

-- ── supplier_categories ──────────────────────────────────────────────────────
ALTER TABLE public.supplier_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view supplier_categories" ON public.supplier_categories;
CREATE POLICY "Authenticated users can view supplier_categories"
ON public.supplier_categories FOR SELECT TO authenticated USING (true);

-- ── suppliers ────────────────────────────────────────────────────────────────
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers FOR SELECT TO authenticated USING (true);

-- ── venues ───────────────────────────────────────────────────────────────────
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view venues" ON public.venues;
CREATE POLICY "Authenticated users can view venues"
ON public.venues FOR SELECT TO authenticated USING (true);

-- ── venue_types ──────────────────────────────────────────────────────────────
ALTER TABLE public.venue_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view venue_types" ON public.venue_types;
CREATE POLICY "Authenticated users can view venue_types"
ON public.venue_types FOR SELECT TO authenticated USING (true);

-- ── hospitality_profiles ─────────────────────────────────────────────────────
ALTER TABLE public.hospitality_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view hospitality_profiles" ON public.hospitality_profiles;
CREATE POLICY "Authenticated users can view hospitality_profiles"
ON public.hospitality_profiles FOR SELECT TO authenticated USING (true);

-- ── hospitality_types ────────────────────────────────────────────────────────
ALTER TABLE public.hospitality_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view hospitality_types" ON public.hospitality_types;
CREATE POLICY "Authenticated users can view hospitality_types"
ON public.hospitality_types FOR SELECT TO authenticated USING (true);

-- ── amenity_types ────────────────────────────────────────────────────────────
ALTER TABLE public.amenity_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view amenity_types" ON public.amenity_types;
CREATE POLICY "Authenticated users can view amenity_types"
ON public.amenity_types FOR SELECT TO authenticated USING (true);

-- ── event_themes ─────────────────────────────────────────────────────────────
ALTER TABLE public.event_themes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view event_themes" ON public.event_themes;
CREATE POLICY "Authenticated users can view event_themes"
ON public.event_themes FOR SELECT TO authenticated USING (true);

-- ── event_types ──────────────────────────────────────────────────────────────
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view event_types" ON public.event_types;
CREATE POLICY "Authenticated users can view event_types"
ON public.event_types FOR SELECT TO authenticated USING (true);
