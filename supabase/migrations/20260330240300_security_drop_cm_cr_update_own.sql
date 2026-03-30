-- Lovable round 4 (4/4): cr_update_own permissive WITH CHECK (true) — drop if Lovable re-added it

DROP POLICY IF EXISTS cr_update_own ON public.cm_change_requests;
