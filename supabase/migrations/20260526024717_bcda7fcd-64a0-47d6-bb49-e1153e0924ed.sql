INSERT INTO public.vendor_rental_types (name)
SELECT 'Canopies'
WHERE NOT EXISTS (SELECT 1 FROM public.vendor_rental_types WHERE name ILIKE 'canop%');