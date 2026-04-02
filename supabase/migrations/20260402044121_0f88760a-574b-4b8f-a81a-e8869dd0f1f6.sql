-- Fix: Remove duplicate cr_update_own policies with WITH CHECK (true)
-- and ensure only the correct one with WITH CHECK (requested_by = auth.uid()) remains

-- Drop ALL cr_update_own policies first
DROP POLICY IF EXISTS "cr_update_own" ON public.change_requests;

-- Recreate the single correct policy with proper WITH CHECK
CREATE POLICY "cr_update_own" ON public.change_requests
  FOR UPDATE TO authenticated
  USING ((requested_by)::text = (auth.uid())::text)
  WITH CHECK ((requested_by)::text = (auth.uid())::text);