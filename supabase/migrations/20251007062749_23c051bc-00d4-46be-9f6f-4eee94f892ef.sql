-- Allow authenticated users to view all profiles for task assignments
CREATE POLICY "Users can view all profiles for assignments"
ON profiles
FOR SELECT
TO authenticated
USING (true);