-- Enable RLS on Manage Event table
ALTER TABLE "Manage Event" ENABLE ROW LEVEL SECURITY;

-- Create policies for Manage Event table
DROP POLICY IF EXISTS "Users can view their own events" ON "Manage Event";
CREATE POLICY "Users can view their own events" 
ON "Manage Event" 
FOR SELECT 
USING (event_user_id = (auth.uid())::text);

DROP POLICY IF EXISTS "Users can create their own events" ON "Manage Event";
CREATE POLICY "Users can create their own events" 
ON "Manage Event" 
FOR INSERT 
WITH CHECK (event_user_id = (auth.uid())::text);

DROP POLICY IF EXISTS "Users can update their own events" ON "Manage Event";
CREATE POLICY "Users can update their own events" 
ON "Manage Event" 
FOR UPDATE 
USING (event_user_id = (auth.uid())::text)
WITH CHECK (event_user_id = (auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete their own events" ON "Manage Event";
CREATE POLICY "Users can delete their own events" 
ON "Manage Event" 
FOR DELETE 
USING (event_user_id = (auth.uid())::text);