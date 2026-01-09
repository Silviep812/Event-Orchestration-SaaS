-- Fix RLS policies for change_requests table
-- This allows coordinators and admins to create change requests

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Host with Admin/Coordinator or Admin can view change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Host with Admin/Coordinator or Admin can create change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Admin can update change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Users can view change requests for their events" ON public.change_requests;
DROP POLICY IF EXISTS "Users can create change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Coordinators can update change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Users can view change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Users can update change requests" ON public.change_requests;

-- SELECT: Allow users to view change requests if they:
-- 1. Are admin (using has_permission_level function)
-- 2. Are coordinator (using has_permission_level function)
-- 3. Created the change request
-- 4. Own the event
CREATE POLICY "Users can view change requests"
ON public.change_requests
FOR SELECT
USING (
  -- Admin can view all
  has_permission_level(auth.uid(), 'admin'::permission_level) OR
  -- Coordinator can view all
  has_permission_level(auth.uid(), 'coordinator'::permission_level) OR
  -- User created the request
  requested_by = auth.uid() OR
  -- User owns the event (for events table with UUID)
  (event_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.events
    WHERE id::text = event_id
    AND user_id = auth.uid()
  )) OR
  -- User owns the event (for Create Event table with TEXT userid)
  (event_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public."Create Event"
    WHERE userid = event_id
    AND userid = auth.uid()::text
  ))
);

-- INSERT: Allow authenticated users to create change requests if they:
-- 1. Are admin
-- 2. Are coordinator  
-- 3. Are authenticated and setting themselves as requested_by
CREATE POLICY "Users can create change requests"
ON public.change_requests
FOR INSERT
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL AND
  (
    -- Admin can create
    has_permission_level(auth.uid(), 'admin'::permission_level) OR
    -- Coordinator can create
    has_permission_level(auth.uid(), 'coordinator'::permission_level) OR
    -- Any authenticated user can create if they're the requester
    (requested_by = auth.uid())
  )
);

-- UPDATE: Allow users to update change requests if they:
-- 1. Are admin
-- 2. Are coordinator
-- 3. Created the request (for pending requests only)
CREATE POLICY "Users can update change requests"
ON public.change_requests
FOR UPDATE
USING (
  -- Admin can update
  has_permission_level(auth.uid(), 'admin'::permission_level) OR
  -- Coordinator can update
  has_permission_level(auth.uid(), 'coordinator'::permission_level) OR
  -- User can update their own pending requests
  (requested_by = auth.uid() AND status = 'pending')
)
WITH CHECK (
  -- Same conditions for the new values
  has_permission_level(auth.uid(), 'admin'::permission_level) OR
  has_permission_level(auth.uid(), 'coordinator'::permission_level) OR
  (requested_by = auth.uid() AND status = 'pending')
);

-- Enable Realtime for change_requests table (if not already enabled)
DO $$
BEGIN
  -- Check if table is already in the publication
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'change_requests'
    AND schemaname = 'public'
  ) THEN
    -- Add table to realtime publication if it exists
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.change_requests;
      RAISE NOTICE 'Added change_requests to realtime publication';
    ELSE
      RAISE NOTICE 'supabase_realtime publication does not exist - enable Realtime in Supabase Dashboard';
    END IF;
  ELSE
    RAISE NOTICE 'change_requests is already in realtime publication';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'change_requests is already in realtime publication';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add to realtime publication: %', SQLERRM;
END $$;

