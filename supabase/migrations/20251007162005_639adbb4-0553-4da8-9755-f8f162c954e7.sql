-- Add category column to tasks table to store collaborator type (Bookings, Venue, etc.)
ALTER TABLE tasks 
ADD COLUMN category TEXT;

-- Add index for better search performance on category field
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

-- Add comment for documentation
COMMENT ON COLUMN tasks.category IS 'Task category based on collaborator type (e.g., Bookings, Venue, Hospitality, Suppliers, Services)';