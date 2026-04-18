-- First-time in-app onboarding gate + richer default profile row on signup.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS
  'When set, user has completed the in-app onboarding step. NULL = redirect to /onboarding.';

-- Existing accounts should not be forced through onboarding on deploy.
UPDATE public.profiles
SET onboarding_completed_at = COALESCE(onboarding_completed_at, now())
WHERE onboarding_completed_at IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_local text;
  v_display text;
BEGIN
  v_display := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), '');
  IF v_display IS NULL OR v_display = '' THEN
    v_display := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), '');
  END IF;

  v_local := LOWER(REGEXP_REPLACE(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), '[^a-zA-Z0-9._-]', '', 'g'));
  IF v_local IS NULL OR v_local = '' THEN
    v_local := 'user_' || LEFT(REPLACE(NEW.id::text, '-', ''), 12);
  END IF;

  IF v_display IS NULL OR v_display = '' THEN
    v_display := INITCAP(REPLACE(REPLACE(REPLACE(v_local, '.', ' '), '_', ' '), '-', ' '));
    IF v_display IS NULL OR TRIM(v_display) = '' THEN
      v_display := 'User';
    END IF;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, username, onboarding_completed_at)
  VALUES (NEW.id, v_display, v_local, NULL);

  RETURN NEW;
END;
$$;
