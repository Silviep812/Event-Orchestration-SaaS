-- Avatar URL snapshot at post time so readers can show photos without SELECT on other users' private profiles.

ALTER TABLE public.discussion_comments
  ADD COLUMN IF NOT EXISTS author_avatar_url text;

COMMENT ON COLUMN public.discussion_comments.author_avatar_url IS
  'Public avatar URL when the comment was posted (from profiles or public_profiles).';

UPDATE public.discussion_comments dc
SET author_avatar_url = NULLIF(TRIM(pp.avatar_url), '')
FROM public.public_profiles pp
WHERE pp.user_id = dc.user_id
  AND (dc.author_avatar_url IS NULL OR TRIM(dc.author_avatar_url) = '')
  AND pp.avatar_url IS NOT NULL
  AND TRIM(pp.avatar_url) <> '';

NOTIFY pgrst, 'reload schema';
