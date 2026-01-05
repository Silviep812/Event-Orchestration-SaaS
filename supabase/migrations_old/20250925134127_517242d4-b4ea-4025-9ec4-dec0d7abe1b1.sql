-- Now we can safely drop the old enum since all policies have been updated
-- First drop any remaining old functions
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role_old);

-- Drop the old enum  
DROP TYPE IF EXISTS public.app_role_old;

-- Verify the new enum is in place
SELECT enum_range(NULL::app_role) AS available_roles;