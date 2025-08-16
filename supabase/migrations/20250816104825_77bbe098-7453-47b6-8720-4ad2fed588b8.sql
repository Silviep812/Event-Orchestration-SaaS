-- Remove duplicate Bridal Shower entries from array-based columns; keep the dedicated bridal_shower field
UPDATE "Themes Directory"
SET
  special_event = CASE WHEN special_event IS NOT NULL THEN array_remove(array_remove(special_event, 'Bridal Shower Theme'), 'Bridal Shower') ELSE special_event END,
  parties       = CASE WHEN parties       IS NOT NULL THEN array_remove(array_remove(parties,       'Bridal Shower Theme'), 'Bridal Shower') ELSE parties END,
  meet_up       = CASE WHEN meet_up       IS NOT NULL THEN array_remove(array_remove(meet_up,       'Bridal Shower Theme'), 'Bridal Shower') ELSE meet_up END,
  market_place  = CASE WHEN market_place  IS NOT NULL THEN array_remove(array_remove(market_place,  'Bridal Shower Theme'), 'Bridal Shower') ELSE market_place END,
  sporting      = CASE WHEN sporting      IS NOT NULL THEN array_remove(array_remove(sporting,      'Bridal Shower Theme'), 'Bridal Shower') ELSE sporting END;
