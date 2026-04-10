-- Ensure standard transportation type rows exist even if an older migration only seeded an empty table.
INSERT INTO public.transportation_types (name)
SELECT v
FROM (
  VALUES
    ('Bus'),
    ('Van'),
    ('Car/SUV'),
    ('Limousine'),
    ('Truck'),
    ('Other')
) AS t(v)
WHERE NOT EXISTS (
  SELECT 1 FROM public.transportation_types z WHERE lower(trim(z.name)) = lower(trim(t.v))
);

NOTIFY pgrst, 'reload schema';
