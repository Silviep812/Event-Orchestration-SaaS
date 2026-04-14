-- If 20260417193000 already ran with root row named "Sporting", rename it so Create Event
-- does not show "Sporting" twice (theme + category).

UPDATE public.event_types et
SET name = 'Event formats'
FROM public.event_themes th
WHERE et.theme_id = th.id
  AND LOWER(TRIM(th.name)) IN ('sport', 'sports', 'sporting')
  AND et.parent_id IS NULL
  AND LOWER(TRIM(et.name)) IN ('sport', 'sports', 'sporting');
