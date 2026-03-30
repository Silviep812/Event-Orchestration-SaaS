-- Deliverable 1: event resource links, event-level archive, task assignee display name

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS entertainment_id uuid REFERENCES public.entertainments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS serv_vendor_rental_id uuid REFERENCES public.serv_vendor_rentals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.events.entertainment_id IS 'Optional entertainment profile selected at create/manage event';
COMMENT ON COLUMN public.events.serv_vendor_rental_id IS 'Optional service rental vendor profile';
COMMENT ON COLUMN public.events.archived IS 'When true, event is archived at event level (hides from default lists)';

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS assigned_to_display_name text;

COMMENT ON COLUMN public.tasks.assigned_to_display_name IS 'Manual assignee name when not linked to a user';
