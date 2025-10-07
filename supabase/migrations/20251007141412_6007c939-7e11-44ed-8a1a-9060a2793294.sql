-- Remove specific user profiles as requested
-- 1. Remove IDA Event Partners
DELETE FROM public.profiles 
WHERE user_id = '8ca9f4e0-8dc0-42b3-85ba-ee879ad1ed4f';

-- 2. Remove User entries with no role assignment
DELETE FROM public.profiles 
WHERE display_name = 'User' 
AND user_id NOT IN (SELECT user_id FROM public.user_roles);

-- 3. Remove duplicate User with event_planner role (keep oldest one)
DELETE FROM public.profiles 
WHERE user_id = '2480bdd6-ded5-48ab-97b2-47fa094175d6';