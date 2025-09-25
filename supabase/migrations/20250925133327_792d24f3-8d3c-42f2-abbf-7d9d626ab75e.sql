-- Add new role values to existing enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'host';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'organizer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'event_planner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'venue_owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hospitality_provider';