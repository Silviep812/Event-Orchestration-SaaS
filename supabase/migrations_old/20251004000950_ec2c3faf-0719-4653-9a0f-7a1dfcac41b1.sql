-- Update Meetup theme to include Community tag
UPDATE event_themes 
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), 'Community')
WHERE name = 'Meetup' 
AND NOT ('Community' = ANY(COALESCE(tags, ARRAY[]::text[])));