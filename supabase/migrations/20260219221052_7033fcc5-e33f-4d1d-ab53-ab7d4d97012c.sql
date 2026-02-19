-- Add new role values to existing app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sponsor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'stakeholder';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'venue_manager';