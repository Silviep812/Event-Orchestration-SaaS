-- Ensure all venue entries have complete data

-- Update any null costs with default values based on venue type
UPDATE venues 
SET cost = 2000 
WHERE cost IS NULL AND venue_type_id = '1'; -- Private Residence

UPDATE venues 
SET cost = 5000 
WHERE cost IS NULL AND venue_type_id = '2'; -- Business Location

UPDATE venues 
SET cost = 3500 
WHERE cost IS NULL AND venue_type_id = '3'; -- Restaurant Location

UPDATE venues 
SET cost = 8000 
WHERE cost IS NULL AND venue_type_id = '4'; -- Resort Location

UPDATE venues 
SET cost = 4000 
WHERE cost IS NULL AND venue_type_id = '5'; -- Recreation Location

UPDATE venues 
SET cost = 6000 
WHERE cost IS NULL AND venue_type_id = '6'; -- Private Club

UPDATE venues 
SET cost = 3000 
WHERE cost IS NULL AND venue_type_id = '7'; -- Market Place

UPDATE venues 
SET cost = 1500 
WHERE cost IS NULL AND venue_type_id = '8'; -- Local Parks

UPDATE venues 
SET cost = 4500 
WHERE cost IS NULL
  AND venue_type_id = (
    SELECT COALESCE(
      (SELECT id FROM public.venue_types WHERE name = 'Hospitality Location' ORDER BY id LIMIT 1),
      (SELECT id FROM public.venue_types WHERE name = 'Other' ORDER BY id LIMIT 1)
    )
  );

UPDATE venues 
SET cost = 2500 
WHERE cost IS NULL AND venue_type_id = '10'; -- Farm Table

UPDATE venues 
SET cost = 7000 
WHERE cost IS NULL AND venue_type_id = '11'; -- Warehouse

UPDATE venues 
SET cost = 2000 
WHERE cost IS NULL AND venue_type_id = '12'; -- State Parks

UPDATE venues 
SET cost = 10000 
WHERE cost IS NULL AND venue_type_id = '13'; -- Sporting Facility

UPDATE venues 
SET cost = 1000 
WHERE cost IS NULL AND venue_type_id = '14'; -- Other

-- Ensure all venues have capacity (set default if null)
UPDATE venues 
SET capacity = 100 
WHERE capacity IS NULL;

-- Ensure all venues have state set to MD
UPDATE venues 
SET state = 'MD' 
WHERE state IS NULL OR state = '';

-- Ensure all phone numbers are properly formatted (remove any that are invalid)
UPDATE venues 
SET phone_number = NULL 
WHERE phone_number IS NOT NULL AND LENGTH(phone_number) < 10;