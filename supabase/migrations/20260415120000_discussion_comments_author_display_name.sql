-- Snapshot display name on each comment so the UI can show names without SELECT on private profiles (RLS).

ALTER TABLE public.discussion_comments
  ADD COLUMN IF NOT EXISTS author_display_name text;

COMMENT ON COLUMN public.discussion_comments.author_display_name IS
  'Display label at post time; avoids relying on public_profiles for every author.';

UPDATE public.discussion_comments dc
SET author_display_name = NULLIF(TRIM(pp.display_name), '')
FROM public.public_profiles pp
WHERE pp.user_id = dc.user_id
  AND dc.author_display_name IS NULL
  AND pp.display_name IS NOT NULL
  AND TRIM(pp.display_name) <> '';

NOTIFY pgrst, 'reload schema';
