-- Workflows: FK columns for wizard selections (code + types.ts expect these; some DBs never got them).
-- Safe to re-run: IF NOT EXISTS.

ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS hospitality_id uuid REFERENCES public.hospitality_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL;
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS serv_vendor_sup_id uuid REFERENCES public.serv_vendor_suppliers(id) ON DELETE SET NULL;
ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS serv_vendor_rent_id uuid REFERENCES public.serv_vendor_rentals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workflows_hospitality_id ON public.workflows(hospitality_id);
CREATE INDEX IF NOT EXISTS idx_workflows_venue_id ON public.workflows(venue_id);
CREATE INDEX IF NOT EXISTS idx_workflows_supplier_id ON public.workflows(supplier_id);
CREATE INDEX IF NOT EXISTS idx_workflows_serv_vendor_sup_id ON public.workflows(serv_vendor_sup_id);
CREATE INDEX IF NOT EXISTS idx_workflows_serv_vendor_rent_id ON public.workflows(serv_vendor_rent_id);

NOTIFY pgrst, 'reload schema';
