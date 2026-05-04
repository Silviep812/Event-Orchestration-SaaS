-- Update Crestline supplier with email and phone number (one row; skip if unique pair already taken)
UPDATE suppliers s
SET
  email = 'Crestline.com',
  phone_number = '866-488-4975',
  updated_at = now()
FROM (
  SELECT id FROM suppliers
  WHERE business_name = 'Crestline' AND category_id = 5
  ORDER BY created_at ASC NULLS LAST
  LIMIT 1
) pick
WHERE s.id = pick.id
  AND NOT EXISTS (
    SELECT 1 FROM suppliers o
    WHERE o.business_name = 'Crestline'
      AND o.email = 'Crestline.com'
      AND o.id <> s.id
  );
