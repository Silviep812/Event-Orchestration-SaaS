-- CRITICAL SECURITY FIX: Secure the User table containing personal information
-- This table contains sensitive PII and must be protected with RLS policies

-- Enable Row Level Security on the User table
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile data
CREATE POLICY "Users can view their own profile" 
ON public."User" 
FOR SELECT 
USING (userid = auth.uid());

-- Policy 2: Users can update their own profile data
CREATE POLICY "Users can update their own profile" 
ON public."User" 
FOR UPDATE 
USING (userid = auth.uid())
WITH CHECK (userid = auth.uid());

-- Policy 3: Users can insert their own profile (for registration)
CREATE POLICY "Users can create their own profile" 
ON public."User" 
FOR INSERT 
WITH CHECK (userid = auth.uid());

-- Policy 4: Users can delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public."User" 
FOR DELETE 
USING (userid = auth.uid());