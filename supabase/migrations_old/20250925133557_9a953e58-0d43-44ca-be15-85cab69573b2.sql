-- First, let's check what data exists in user_roles table with old values
SELECT role, COUNT(*) as count 
FROM public.user_roles 
WHERE role IN ('admin', 'event_manager', 'vendor_coordinator', 'budget_manager', 'task_coordinator', 'client')
GROUP BY role;