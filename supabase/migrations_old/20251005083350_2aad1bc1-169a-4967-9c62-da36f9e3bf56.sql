-- Update Crestline supplier with email and phone number
UPDATE suppliers 
SET 
  email = 'Crestline.com',
  phone_number = '866-488-4975',
  updated_at = now()
WHERE business_name = 'Crestline' AND category_id = 5;