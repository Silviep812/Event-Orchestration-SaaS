-- Add new column for manually entered coordinator names
ALTER TABLE tasks 
ADD COLUMN assigned_coordinator_name text;

COMMENT ON COLUMN tasks.assigned_coordinator_name IS 'Manually entered coordinator name for task assignment';

-- Temporarily disable the logging trigger to allow deletion
ALTER TABLE tasks DISABLE TRIGGER log_task_changes_trigger;

-- Remove invalid task entries
DELETE FROM tasks 
WHERE id = '460200aa-fec2-4b04-a3b2-c07e21006ef8' 
AND title = 'Lee Task Team';

-- Remove duplicate "Lee Collaborators" entries (keeping tasks with proper categories)
DELETE FROM tasks 
WHERE title = 'Lee Collaborators' 
AND category IS NULL;

-- Re-enable the logging trigger
ALTER TABLE tasks ENABLE TRIGGER log_task_changes_trigger;