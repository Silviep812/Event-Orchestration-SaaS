-- Task 1: Reusable templates for 2 workflows + optional template budget lines

ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS template_kind text NOT NULL DEFAULT 'project_management';

DO $$
BEGIN
  ALTER TABLE public.templates
    DROP CONSTRAINT IF EXISTS templates_template_kind_check;
  ALTER TABLE public.templates
    ADD CONSTRAINT templates_template_kind_check
    CHECK (template_kind IN ('manage_event', 'project_management'));
EXCEPTION WHEN others THEN
  NULL;
END $$;

COMMENT ON COLUMN public.templates.template_kind IS
  'Workflow template kind: manage_event (Host) or project_management (Organizer/Planner)';

CREATE TABLE IF NOT EXISTS public.template_budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'other',
  item_name text NOT NULL,
  estimated_cost numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS template_budget_items_template_id_idx
  ON public.template_budget_items (template_id);

ALTER TABLE public.template_budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own template budget items" ON public.template_budget_items;
CREATE POLICY "Users manage own template budget items"
  ON public.template_budget_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seed system starter templates are created per-user on first Planning Assets visit (app-side),
-- because templates.user_id is required. Migration only ensures schema.
