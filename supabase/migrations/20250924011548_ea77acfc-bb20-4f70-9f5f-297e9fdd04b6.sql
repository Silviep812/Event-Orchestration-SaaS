-- Add archived field to budget_items table
ALTER TABLE public.budget_items ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;

-- Add index for better performance when filtering archived items
CREATE INDEX idx_budget_items_archived ON public.budget_items(archived);