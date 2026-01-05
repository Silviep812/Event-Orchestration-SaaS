-- Add capacity and make_reservations columns to hospitality_profiles table
ALTER TABLE hospitality_profiles
ADD COLUMN IF NOT EXISTS capacity integer,
ADD COLUMN IF NOT EXISTS make_reservations text;

-- Update existing entries with sample data
UPDATE hospitality_profiles
SET capacity = CASE 
  WHEN hospitality_type = 1 THEN 150  -- Hotel
  WHEN hospitality_type = 3 THEN 200  -- Resort
  WHEN hospitality_type = 4 THEN 8    -- Airbnb
  ELSE 100
END,
make_reservations = 'https://reservations.example.com'
WHERE capacity IS NULL;