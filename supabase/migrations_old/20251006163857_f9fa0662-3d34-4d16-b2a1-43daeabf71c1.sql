-- Add user_id column to Bookings Directory
ALTER TABLE "Bookings Directory" 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set user_id for existing records (if any) - they'll need to be claimed or migrated
-- For now, we'll allow NULL temporarily for existing records

-- Create index for better performance
CREATE INDEX idx_bookings_directory_user_id ON "Bookings Directory"(user_id);

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Anyone can view bookings directory" ON "Bookings Directory";

-- Create user-specific RLS policies
CREATE POLICY "Users can view their own bookings"
ON "Bookings Directory"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
ON "Bookings Directory"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
ON "Bookings Directory"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings"
ON "Bookings Directory"
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);