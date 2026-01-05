-- Add VanLife and Online Dating to meetup types in Themes Directory
UPDATE "Themes Directory"
SET meet_up = array_append(array_append(COALESCE(meet_up, ARRAY[]::text[]), 'VanLife'), 'Online Dating')
WHERE meet_up IS NOT NULL OR meet_up IS NULL;