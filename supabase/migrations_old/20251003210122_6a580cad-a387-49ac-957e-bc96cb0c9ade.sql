-- Remove 'Celebration' tag from Festival theme, keeping only Cultural and Community
UPDATE public.event_themes 
SET tags = ARRAY['Cultural', 'Community']::text[]
WHERE id = 4 AND name = 'Festival';