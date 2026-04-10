-- Seed common Vendor Service Rental/Buy profile types when the table is empty or sparse (IEP §7).
INSERT INTO public.vendor_supplier_types (name)
SELECT v
FROM (
  VALUES
    ('Tent & canopy'),
    ('Tables & chairs'),
    ('AV & lighting'),
    ('Linens & decor'),
    ('Staging & props'),
    ('Transport & logistics'),
    ('Entertainment equipment'),
    ('Purchase — consumables & materials')
) AS t(v)
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendor_supplier_types z WHERE lower(trim(z.name)) = lower(trim(t.v))
);
