-- Fix remaining functions missing SET search_path = public
-- This prevents search-path injection attacks in SECURITY DEFINER functions

-- 1. log_budget_item_changes (already has it, but verify)
ALTER FUNCTION public.log_budget_item_changes() SET search_path = public;

-- 2. log_change
ALTER FUNCTION public.log_change(text, uuid, text, text, text, text, text) SET search_path = public;

-- 3. recalculate_project_timeline
ALTER FUNCTION public.recalculate_project_timeline(uuid) SET search_path = public;

-- 4. sync_create_event_to_manage_event
ALTER FUNCTION public.sync_create_event_to_manage_event() SET search_path = public;

-- 5. update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 6. handle_task_estimate_change (already has it, but verify)
ALTER FUNCTION public.handle_task_estimate_change() SET search_path = public;

-- 7. notify_coordinators (already has it, but verify)  
ALTER FUNCTION public.notify_coordinators(text, text, text, text, uuid) SET search_path = public;

-- 8. set_user_profile_user_id
ALTER FUNCTION public.set_user_profile_user_id() SET search_path = public;

-- 9. get_my_events_safe
ALTER FUNCTION public.get_my_events_safe() SET search_path = public;