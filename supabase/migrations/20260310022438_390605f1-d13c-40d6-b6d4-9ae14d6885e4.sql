-- 1. Drop dangerous bootstrap policies that allow privilege escalation on user_roles
DROP POLICY IF EXISTS "Bootstrap: Allow role assignment for non-admin users" ON public.user_roles;
DROP POLICY IF EXISTS "Bootstrap: Allow role updates for non-admin users" ON public.user_roles;

-- 2. Drop the dangerous execute_raw_sql function
DROP FUNCTION IF EXISTS public.execute_raw_sql(text);

-- 3. Remove public SELECT policy on qrcode_submissions that exposes PII
DROP POLICY IF EXISTS "Anyone can view qrcode submissions" ON public.qrcode_submissions;