-- Create function to update resource utilization
-- Calculates utilization percentage and available count for resources
CREATE OR REPLACE FUNCTION update_resource_utilization(
  p_resource_id UUID DEFAULT NULL,
  p_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
  resource_id UUID,
  utilization_percent NUMERIC,
  available_count INTEGER,
  allocated_count INTEGER,
  total_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resource RECORD;
BEGIN
  -- If resource_id is provided, update that specific resource
  IF p_resource_id IS NOT NULL THEN
    SELECT id, allocated, total INTO v_resource
    FROM resources
    WHERE id = p_resource_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Resource not found: %', p_resource_id;
    END IF;
    
    -- Calculate utilization
    RETURN QUERY SELECT 
      v_resource.id,
      CASE 
        WHEN v_resource.total > 0 
        THEN ROUND((v_resource.allocated::NUMERIC / v_resource.total::NUMERIC) * 100, 2)
        ELSE 0 
      END AS utilization_percent,
      GREATEST(0, v_resource.total - v_resource.allocated) AS available_count,
      v_resource.allocated AS allocated_count,
      v_resource.total AS total_count;
  
  -- If event_id is provided, update all resources for that event
  ELSIF p_event_id IS NOT NULL THEN
    FOR v_resource IN 
      SELECT id, allocated, total
      FROM resources
      WHERE event_id = p_event_id
    LOOP
      RETURN QUERY SELECT 
        v_resource.id,
        CASE 
          WHEN v_resource.total > 0 
          THEN ROUND((v_resource.allocated::NUMERIC / v_resource.total::NUMERIC) * 100, 2)
          ELSE 0 
        END AS utilization_percent,
        GREATEST(0, v_resource.total - v_resource.allocated) AS available_count,
        v_resource.allocated AS allocated_count,
        v_resource.total AS total_count;
    END LOOP;
  
  -- If neither provided, return all resources
  ELSE
    FOR v_resource IN 
      SELECT id, allocated, total
      FROM resources
    LOOP
      RETURN QUERY SELECT 
        v_resource.id,
        CASE 
          WHEN v_resource.total > 0 
          THEN ROUND((v_resource.allocated::NUMERIC / v_resource.total::NUMERIC) * 100, 2)
          ELSE 0 
        END AS utilization_percent,
        GREATEST(0, v_resource.total - v_resource.allocated) AS available_count,
        v_resource.allocated AS allocated_count,
        v_resource.total AS total_count;
    END LOOP;
  END IF;
  
  RETURN;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_resource_utilization(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION update_resource_utilization(UUID, UUID) IS 'Calculates resource utilization percentage and available count. Can be called with resource_id (single resource), event_id (all resources for event), or neither (all resources).';

