WITH d AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY business_name ORDER BY created_at ASC, id ASC) rn
  FROM public.entertainments
)
DELETE FROM public.entertainments WHERE id IN (SELECT id FROM d WHERE rn > 1);

WITH d AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY business_name ORDER BY created_at ASC, id ASC) rn
  FROM public.suppliers
)
DELETE FROM public.suppliers WHERE id IN (SELECT id FROM d WHERE rn > 1);

WITH d AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY business_name ORDER BY created_at ASC, id ASC) rn
  FROM public.vendor
)
DELETE FROM public.vendor WHERE id IN (SELECT id FROM d WHERE rn > 1);