-- Lovable round 2 (2/5): venues INSERT ownership

DROP POLICY IF EXISTS "Authenticated users can insert venues" ON public.venues;
CREATE POLICY "Authenticated users can insert venues"
ON public.venues
FOR INSERT TO authenticated
WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());
