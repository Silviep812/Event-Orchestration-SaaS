-- Drop existing RLS policies for change_requests (both old and new names)
DROP POLICY IF EXISTS "Users can view change requests for their events" ON public.change_requests;
DROP POLICY IF EXISTS "Users can create change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Coordinators can update change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Admin can update change requests" ON public.change_requests;
-- Drop new policy names in case migration was partially run before
DROP POLICY IF EXISTS "Host with Admin/Coordinator or Admin can view change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Host with Admin/Coordinator or Admin can create change requests" ON public.change_requests;

-- Create new RLS policies restricting access to Host (viewer) and Admin only

-- SELECT: Only Host role with Admin or Coordinator permission level, or Admin can view change requests
CREATE POLICY "Host with Admin/Coordinator or Admin can view change requests"
ON public.change_requests
FOR SELECT
USING (
  -- Admin with any role
  has_permission_level(auth.uid(), 'admin'::permission_level) OR
  -- Host role with admin or coordinator permission level
  (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'host'::app_role
    ) AND
    (has_permission_level(auth.uid(), 'admin'::permission_level) OR 
     has_permission_level(auth.uid(), 'coordinator'::permission_level))
  )
);

-- INSERT: Only Host role with Admin or Coordinator permission level, or Admin can create change requests
-- Note: Regular coordinators (without host role) cannot create change requests
CREATE POLICY "Host with Admin/Coordinator or Admin can create change requests"
ON public.change_requests
FOR INSERT
WITH CHECK (
  -- Admin with any role
  has_permission_level(auth.uid(), 'admin'::permission_level) OR
  -- Host role with admin or coordinator permission level
  (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'host'::app_role
    ) AND
    (has_permission_level(auth.uid(), 'admin'::permission_level) OR 
     has_permission_level(auth.uid(), 'coordinator'::permission_level))
  )
);

-- UPDATE: Only Admin can update change requests (for status changes via RPC functions)
-- Coordinators can approve/reject via RPC functions, not direct updates
CREATE POLICY "Admin can update change requests"
ON public.change_requests
FOR UPDATE
USING (
  has_permission_level(auth.uid(), 'admin'::permission_level)
);

