-- Add show_in_dir column to venues table
ALTER TABLE public.venues 
ADD COLUMN show_in_dir BOOLEAN NOT NULL DEFAULT true;