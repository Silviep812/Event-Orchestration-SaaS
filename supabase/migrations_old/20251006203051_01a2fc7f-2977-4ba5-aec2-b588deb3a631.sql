-- Drop the existing restrictive SELECT policy on tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;

-- Create a new policy that allows users to see tasks for events they own
CREATE POLICY "Users can view tasks for their events"
ON tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = tasks.event_id 
    AND events.user_id = auth.uid()
  )
);

-- Also update other policies to allow access to tasks for events the user owns
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
CREATE POLICY "Users can update tasks for their events"
ON tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = tasks.event_id 
    AND events.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "Users can delete tasks for their events"
ON tasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = tasks.event_id 
    AND events.user_id = auth.uid()
  )
);