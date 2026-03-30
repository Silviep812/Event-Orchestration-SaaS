-- PostgreSQL forbids using a newly added enum label in the same transaction as ALTER TYPE ... ADD VALUE (55P04).
-- RLS policies in 20250814071752 reference these literals; they must be committed in a prior migration.

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'event_manager', 'vendor_coordinator', 'budget_manager', 'task_coordinator', 'client');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'event_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'budget_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'task_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
