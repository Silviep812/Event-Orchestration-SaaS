-- Update Celebration theme description
UPDATE event_themes 
SET description = 'Holidays and Personal'
WHERE LOWER(name) LIKE '%celebration%';