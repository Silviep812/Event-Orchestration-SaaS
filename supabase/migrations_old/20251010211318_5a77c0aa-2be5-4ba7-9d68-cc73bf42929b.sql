-- Recreate profiles for existing auth.users
INSERT INTO public.profiles (user_id, display_name, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'User'),
  created_at,
  now()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL);