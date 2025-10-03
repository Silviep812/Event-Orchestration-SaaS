-- Restore Celebration theme
INSERT INTO public.event_themes (id, name, description, tags, premium, created_at)
VALUES (
  3,
  'Celebration',
  'Holidays and Personal',
  ARRAY['Holidays', 'Personal']::text[],
  false,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  premium = EXCLUDED.premium;