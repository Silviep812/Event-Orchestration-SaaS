-- Add RLS policies for venues table to allow users to manage their own venues

-- Allow users to insert their own venues
CREATE POLICY "Users can create their own venues"
ON public.venues
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own venues
CREATE POLICY "Users can update their own venues"
ON public.venues
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own venues
CREATE POLICY "Users can delete their own venues"
ON public.venues
FOR DELETE
USING (user_id = auth.uid());