-- Update Marketplace theme tags
UPDATE event_themes 
SET tags = ARRAY['Artisans', 'Food', 'Vendors', 'Vintage']
WHERE LOWER(name) LIKE '%marketplace%';