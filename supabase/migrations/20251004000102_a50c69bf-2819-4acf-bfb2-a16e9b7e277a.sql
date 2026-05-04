-- Add Holistic group under Health and Wellness theme (skip if any already exist)
INSERT INTO public.event_types (name, theme_id, parent_id, created_at)
SELECT 'Holistic', 2, 16, now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_types
  WHERE name = 'Holistic' AND parent_id = 16 AND theme_id = 2
);

-- Holistic event types under canonical parent (lowest id if duplicates)
INSERT INTO public.event_types (name, theme_id, parent_id, created_at)
SELECT t.event_type, 2, p.id, now()
FROM (
  SELECT id FROM public.event_types
  WHERE name = 'Holistic' AND parent_id = 16 AND theme_id = 2
  ORDER BY id ASC
  LIMIT 1
) AS p(id)
CROSS JOIN (
  VALUES
    ('Acupuncture Session'),
    ('Alternative Medicine Workshop'),
    ('Breathwork Circle'),
    ('Chinese Medicine Seminar'),
    ('Chiropractic Wellness Day'),
    ('Crystal Healing Session'),
    ('Energy Healing Workshop'),
    ('Functional Medicine Retreat'),
    ('Herbal Medicine Workshop'),
    ('Holistic Health Fair'),
    ('Holistic Nutrition Seminar'),
    ('Homeopathy Workshop'),
    ('Integrative Medicine Conference'),
    ('Mind-Body Connection Workshop'),
    ('Naturopathic Consultation Event'),
    ('Natural Healing Retreat'),
    ('Preventive Health Workshop'),
    ('Sound Healing Session'),
    ('Traditional Chinese Medicine Event'),
    ('Wellness Assessment Day')
) AS t(event_type)
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_types et
  WHERE et.parent_id = p.id AND et.name = t.event_type AND et.theme_id = 2
);
