-- Add budget_item to allowed entity types in change_logs + budget_items audit trigger.
-- Order: function and budget_items trigger first, then change_logs CHECK — avoids common
-- deadlocks when another session holds budget_items while this migration held change_logs.

-- Create trigger function to log budget_items changes
CREATE OR REPLACE FUNCTION public.log_budget_item_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log updates to specific fields
  IF TG_OP = 'UPDATE' THEN
    IF OLD.item_name IS DISTINCT FROM NEW.item_name THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'item_name', OLD.item_name, NEW.item_name);
    END IF;

    IF OLD.category IS DISTINCT FROM NEW.category THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'category', OLD.category::text, NEW.category::text);
    END IF;

    IF OLD.estimated_cost IS DISTINCT FROM NEW.estimated_cost THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'estimated_cost', OLD.estimated_cost::text, NEW.estimated_cost::text);
    END IF;

    IF OLD.actual_cost IS DISTINCT FROM NEW.actual_cost THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'actual_cost', OLD.actual_cost::text, NEW.actual_cost::text);
    END IF;

    IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'payment_status', OLD.payment_status, NEW.payment_status);
    END IF;

    IF OLD.vendor_name IS DISTINCT FROM NEW.vendor_name THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'vendor_name', OLD.vendor_name, NEW.vendor_name);
    END IF;

    IF OLD.archived IS DISTINCT FROM NEW.archived THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'archived', OLD.archived::text, NEW.archived::text);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.log_change('budget_item', NEW.id, 'created', NULL, NULL, NULL,
      format('Budget item "%s" created for category %s', NEW.item_name, NEW.category));
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_change('budget_item', OLD.id, 'deleted', NULL, NULL, NULL,
      format('Budget item "%s" deleted', OLD.item_name));
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger (OR REPLACE avoids separate DROP TRIGGER + extra lock round-trips)
CREATE OR REPLACE TRIGGER log_budget_item_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.budget_items
FOR EACH ROW
EXECUTE FUNCTION public.log_budget_item_changes();

ALTER TABLE public.change_logs DROP CONSTRAINT IF EXISTS change_logs_entity_type_check;

ALTER TABLE public.change_logs
ADD CONSTRAINT change_logs_entity_type_check
CHECK (entity_type IN ('task', 'event', 'team', 'role', 'notification', 'workflow', 'budget_item'));
