-- CRITICAL SECURITY FIX: Secure the "Create Event" table
-- This table contains sensitive event data including emails, phone numbers, and must be protected

-- Enable Row Level Security on the "Create Event" table
ALTER TABLE public."Create Event" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only view their own events
CREATE POLICY "Users can view their own events" 
ON public."Create Event" 
FOR SELECT 
USING (userid = auth.uid()::text);

-- Policy 2: Users can create events for themselves
CREATE POLICY "Users can create their own events" 
ON public."Create Event" 
FOR INSERT 
WITH CHECK (userid = auth.uid()::text);

-- Policy 3: Users can update their own events
CREATE POLICY "Users can update their own events" 
ON public."Create Event" 
FOR UPDATE 
USING (userid = auth.uid()::text)
WITH CHECK (userid = auth.uid()::text);

-- Policy 4: Users can delete their own events
CREATE POLICY "Users can delete their own events" 
ON public."Create Event" 
FOR DELETE 
USING (userid = auth.uid()::text);