CREATE OR REPLACE FUNCTION public.enforce_discussion_comment_author()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name text;
  v_avatar_url text;
BEGIN
  -- Always derive author identity fields from the authenticated user's profile,
  -- ignoring any client-supplied values to prevent impersonation.
  SELECT COALESCE(display_name, username), avatar_url
    INTO v_display_name, v_avatar_url
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  NEW.author_display_name := v_display_name;
  NEW.author_avatar_url := v_avatar_url;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_discussion_comment_author ON public.discussion_comments;
CREATE TRIGGER trg_enforce_discussion_comment_author
BEFORE INSERT OR UPDATE ON public.discussion_comments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_discussion_comment_author();

-- Backfill any rows whose stored author fields don't match the owner's current profile,
-- so historical spoofed values are corrected.
UPDATE public.discussion_comments dc
SET author_display_name = COALESCE(p.display_name, p.username),
    author_avatar_url = p.avatar_url
FROM public.profiles p
WHERE p.user_id = dc.user_id;