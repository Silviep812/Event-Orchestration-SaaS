-- Add costs to the 2 hotels missing cost data
UPDATE hospitality_profiles
SET cost = 3500
WHERE id = '730ce023-8d02-42b4-8392-d1709d82b703'  -- Hotel Revival, Baltimore
  AND cost IS NULL;

UPDATE hospitality_profiles
SET cost = 4500
WHERE id = 'ca8ecc8e-931e-46ee-9276-1865cfcc9bca'  -- The Ivy Hotel, Baltimore
  AND cost IS NULL;