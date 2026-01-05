-- Make name, category_id, and location mandatory in resources table
ALTER TABLE public.resources 
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN category_id SET NOT NULL,
  ALTER COLUMN location SET NOT NULL;