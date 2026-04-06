-- Plain DROP/CREATE for static scanners: one UPDATE policy for requesters with explicit WITH CHECK
-- (not true). Drops legacy duplicate requester policy name from 20260404170000.
-- Trigger trg_block_requester_approval remains from 20260407120000_change_requests_block_requester_self_approval.sql

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS change_requests_update_by_requester ON public.change_requests;
DROP POLICY IF EXISTS cr_update_own ON public.change_requests;

CREATE POLICY cr_update_own ON public.change_requests
  FOR UPDATE TO authenticated
  USING ((requested_by)::text = (auth.uid())::text)
  WITH CHECK ((requested_by)::text = (auth.uid())::text);

NOTIFY pgrst, 'reload schema';
