-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view venue profiles" ON "Venue Profile";

-- Create a proper permissive policy for viewing venue profiles
CREATE POLICY "Anyone can view venue profiles"
ON "Venue Profile"
FOR SELECT
TO public
USING (true);