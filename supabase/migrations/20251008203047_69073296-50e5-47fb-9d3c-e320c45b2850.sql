-- Update trigger function to track all budget_items fields
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
    
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'description', OLD.description, NEW.description);
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
    
    IF OLD.vendor_contact IS DISTINCT FROM NEW.vendor_contact THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'vendor_contact', OLD.vendor_contact, NEW.vendor_contact);
    END IF;
    
    IF OLD.payment_due_date IS DISTINCT FROM NEW.payment_due_date THEN
      PERFORM public.log_change('budget_item', NEW.id, 'updated', 'payment_due_date', OLD.payment_due_date::text, NEW.payment_due_date::text);
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