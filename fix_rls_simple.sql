-- Simple fix for change_requests RLS policies
-- This creates a very permissive policy that should work

-- Drop all existing policies
DROP POLICY IF EXISTS "Host with Admin/Coordinator or Admin can view change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Host with Admin/Coordinator or Admin can create change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Admin can update change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Users can view change requests for their events" ON public.change_requests;
DROP POLICY IF EXISTS "Users can create change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Coordinators can update change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Users can view change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Users can update change requests" ON public.change_requests;

-- Very simple SELECT policy - allow authenticated users to see their own or all if admin/coordinator
CREATE POLICY "Allow select change requests"
ON public.change_requests
FOR SELECT
USING (
  -- User created it
  requested_by = auth.uid() OR
  -- User is admin
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND permission_level = 'admin'
  ) OR
  -- User is coordinator
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND permission_level = 'coordinator'
  )
);

-- Very simple INSERT policy - allow if user is setting themselves as requested_by
CREATE POLICY "Allow insert change requests"
ON public.change_requests
FOR INSERT
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL AND
  -- Must be setting themselves as requested_by
  requested_by = auth.uid()
);

-- Very simple UPDATE policy
CREATE POLICY "Allow update change requests"
ON public.change_requests
FOR UPDATE
USING (
  -- User created it and it's pending
  (requested_by = auth.uid() AND status = 'pending') OR
  -- User is admin
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND permission_level = 'admin'
  ) OR
  -- User is coordinator
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND permission_level = 'coordinator'
  )
)
WITH CHECK (
  -- Same conditions
  (requested_by = auth.uid() AND status = 'pending') OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND permission_level = 'admin'
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND permission_level = 'coordinator'
  )
);

