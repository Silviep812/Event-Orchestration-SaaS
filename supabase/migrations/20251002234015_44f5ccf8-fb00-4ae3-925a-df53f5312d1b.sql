-- Update Festival theme tags
UPDATE event_themes 
SET tags = ARRAY['Cultural', 'Community', 'Celebration']
WHERE LOWER(name) LIKE '%festival%';