-- Allow authenticated users to view basic user information for task assignments
CREATE POLICY "Users can view all user profiles for task assignments"
ON "User"
FOR SELECT
TO authenticated
USING (true);