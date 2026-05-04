-- Add Rejuvenating group under Health and Wellness theme (skip if any already exist)
INSERT INTO public.event_types (name, theme_id, parent_id, created_at)
SELECT 'Rejuvenating', 2, 16, now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_types
  WHERE name = 'Rejuvenating' AND parent_id = 16 AND theme_id = 2
);

-- Rejuvenating event types under canonical parent (lowest id if duplicates)
INSERT INTO public.event_types (name, theme_id, parent_id, created_at)
SELECT t.event_type, 2, p.id, now()
FROM (
  SELECT id FROM public.event_types
  WHERE name = 'Rejuvenating' AND parent_id = 16 AND theme_id = 2
  ORDER BY id ASC
  LIMIT 1
) AS p(id)
CROSS JOIN (
  VALUES
    ('Aromatherapy Session'),
    ('Ayurvedic Retreat'),
    ('Beauty Treatment Day'),
    ('Body Scrub Workshop'),
    ('Detox Retreat'),
    ('Facial Treatment Session'),
    ('Hot Stone Massage Event'),
    ('Hydrotherapy Session'),
    ('Massage Therapy Workshop'),
    ('Mud Bath Experience'),
    ('Reflexology Session'),
    ('Reiki Healing Circle'),
    ('Salt Room Experience'),
    ('Sauna Gathering'),
    ('Spa Day Event'),
    ('Steam Bath Session'),
    ('Thai Massage Workshop'),
    ('Thermal Bath Experience'),
    ('Wellness Spa Retreat'),
    ('Yoga and Massage Combo')
) AS t(event_type)
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_types et
  WHERE et.parent_id = p.id AND et.name = t.event_type AND et.theme_id = 2
);
