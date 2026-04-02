-- Fix: Restrict Comments SELECT to users who are in the creator array
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public."Comments";

CREATE POLICY "Users can view own comments"
ON public."Comments"
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = ANY(creator)
  OR has_permission_level(auth.uid(), 'admin'::permission_level)
  OR has_permission_level(auth.uid(), 'coordinator'::permission_level)
);