-- Drop the User table and all its dependencies
-- This table is no longer used as all user data is now in the profiles table
DROP TABLE IF EXISTS public."User" CASCADE;