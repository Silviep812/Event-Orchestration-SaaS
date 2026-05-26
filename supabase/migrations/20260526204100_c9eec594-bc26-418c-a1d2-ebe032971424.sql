CREATE POLICY "marketing_subscribers_auth_insert"
ON public.marketing_subscribers
FOR INSERT
TO authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(trim(email)) > 3
  AND position('@' in trim(email)) > 1
);