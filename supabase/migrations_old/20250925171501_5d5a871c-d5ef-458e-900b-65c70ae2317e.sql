-- Add archived column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN archived boolean NOT NULL DEFAULT false;