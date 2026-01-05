-- Remove specific themes from the Themes Directory table
UPDATE "Themes Directory" 
SET 
  parties = ARRAY['Birthday Party', 'Holiday Party']::text[],
  market_place = ARRAY['Holiday Market', 'Pop-up Market']::text[],
  meet_up = ARRAY['Business Networking', 'Social Meetup', 'Professional Groups', 'Community Groups', 'Support Groups']::text[],
  sporting = ARRAY['Basketball Game', 'Football Event']::text[]
WHERE parties IS NOT NULL OR market_place IS NOT NULL OR meet_up IS NOT NULL OR sporting IS NOT NULL;