-- Lovable round 2 (3/5): profiles — drop public blanket read

DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;
