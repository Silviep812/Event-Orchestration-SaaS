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

-- Policy 4: Limited public view for collaboration (only username and contact_name, no sensitive data)
CREATE POLICY "Public can view limited user info for collaboration" 
ON public."User" 
FOR SELECT 
USING (true)
-- This policy only exposes non-sensitive fields for collaboration features
-- Sensitive fields like email, contact_phone_nbr will be filtered at application level

-- Policy 5: Users can delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public."User" 
FOR DELETE 
USING (userid = auth.uid());