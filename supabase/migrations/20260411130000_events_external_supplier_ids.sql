-- External procurement vendors (public.suppliers) — not serv_vendor_suppliers (rental/service equipment)

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS external_supplier_ids uuid[] DEFAULT NULL;

COMMENT ON COLUMN public.events.external_supplier_ids IS 'External Vendor / procurement selections from public.suppliers; distinct from service_vendor_ids (serv_vendor_suppliers rentals).';
