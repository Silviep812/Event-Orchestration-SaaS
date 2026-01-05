-- CRITICAL SECURITY FIX: Secure the Authorization table
-- This table contains sensitive authentication data and must be protected

-- Enable Row Level Security on the Authorization table
ALTER TABLE public."Authorization" ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only access their own authorization records
CREATE POLICY "Users can access their own authorization data" 
ON public."Authorization" 
FOR ALL 
USING (create_userid = auth.uid()::text);

-- Create policy: Allow authenticated users to insert their own records
CREATE POLICY "Users can create their own authorization records" 
ON public."Authorization" 
FOR INSERT 
WITH CHECK (create_userid = auth.uid()::text);

-- Create policy: Users can update their own authorization records
CREATE POLICY "Users can update their own authorization records" 
ON public."Authorization" 
FOR UPDATE 
USING (create_userid = auth.uid()::text)
WITH CHECK (create_userid = auth.uid()::text);

-- Create policy: Users can delete their own authorization records
CREATE POLICY "Users can delete their own authorization records" 
ON public."Authorization" 
FOR DELETE 
USING (create_userid = auth.uid()::text);