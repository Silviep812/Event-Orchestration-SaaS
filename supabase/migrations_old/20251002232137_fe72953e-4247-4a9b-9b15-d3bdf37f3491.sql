-- Update Celebration theme tags
UPDATE event_themes 
SET tags = ARRAY['Holidays', 'Personal']
WHERE LOWER(name) LIKE '%celebration%';