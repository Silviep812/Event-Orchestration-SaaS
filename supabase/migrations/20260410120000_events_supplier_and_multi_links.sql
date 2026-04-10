-- External service vendors (supplier directory) + optional multi-select for entertainment and vendors

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS service_vendor_id uuid REFERENCES public.serv_vendor_suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entertainment_ids uuid[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS service_vendor_ids uuid[] DEFAULT NULL;

COMMENT ON COLUMN public.events.service_vendor_id IS 'Optional external service vendor (serv_vendor_suppliers / supplier directory)';
COMMENT ON COLUMN public.events.entertainment_ids IS 'Optional multiple entertainment profiles';
COMMENT ON COLUMN public.events.service_vendor_ids IS 'Optional multiple external service vendor profiles';
