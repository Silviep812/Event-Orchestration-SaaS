-- Remove all role assignments for user with email andrezafeu+event_planner_001@gmail.com
-- User ID: 499fd9fc-7a08-4e08-9594-1ff30c9641c2

DELETE FROM user_roles 
WHERE user_id = '499fd9fc-7a08-4e08-9594-1ff30c9641c2';

-- Log the deletion
DO $$
BEGIN
  RAISE NOTICE 'Deleted all role assignments for user 499fd9fc-7a08-4e08-9594-1ff30c9641c2 (andrezafeu+event_planner_001@gmail.com)';
END $$;