-- Lovable scan: Comments SELECT used USING (true) for all authenticated users.
-- Align with hosted fix: readers must appear in creator[] or be admin/coordinator.

ALTER TABLE public."Comments" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view comments" ON public."Comments";
DROP POLICY IF EXISTS "Users can view own comments" ON public."Comments";

CREATE POLICY "Users can view own comments"
ON public."Comments"
FOR SELECT
TO authenticated
USING (
  (creator IS NOT NULL AND auth.uid()::text = ANY (creator))
  OR public.has_permission_level(auth.uid(), 'admin'::public.permission_level)
  OR public.has_permission_level(auth.uid(), 'coordinator'::public.permission_level)
);

NOTIFY pgrst, 'reload schema';
