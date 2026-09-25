-- Task 2A: resource_categories ids 8 ("Supplier ") and 9 ("Service ") are stored with a
-- trailing space. RESOURCE_CATEGORY_DIRECTORY_ROUTES is keyed on the clean name, so the
-- padded rows resolved to null and ResourceManager raised a directory-gap toast on load.
--
-- Verified before writing this migration: btrim(name) introduces no duplicates, so the
-- existing UNIQUE (name) constraint holds.

UPDATE public.resource_categories
SET name = btrim(name)
WHERE name <> btrim(name);

-- Keep the padding from coming back via the category create/edit UI.
ALTER TABLE public.resource_categories
  DROP CONSTRAINT IF EXISTS resource_categories_name_trimmed;

ALTER TABLE public.resource_categories
  ADD CONSTRAINT resource_categories_name_trimmed
  CHECK (name = btrim(name));
