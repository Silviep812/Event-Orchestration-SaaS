-- Create view for event KPI metrics
CREATE OR REPLACE VIEW event_kpi_view AS
SELECT 
  e.id AS event_id,
  e.title,
  e.status,
  e.start_date,
  e.end_date,
  e.location,
  e.theme_id,
  e.type_id,
  e.created_at,
  -- Task metrics
  COUNT(DISTINCT t.id) AS total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) AS completed_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) AS in_progress_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'not_started' THEN t.id END) AS pending_tasks,
  ROUND(
    CASE 
      WHEN COUNT(DISTINCT t.id) > 0 
      THEN (COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END)::NUMERIC / COUNT(DISTINCT t.id)::NUMERIC) * 100
      ELSE 0 
    END, 
    2
  ) AS task_completion_rate,
  AVG(COALESCE(t.actual_hours, t.estimated_hours, 0)) AS avg_task_duration,
  SUM(COALESCE(t.actual_hours, t.estimated_hours, 0)) AS total_task_hours,
  -- Resource metrics
  COUNT(DISTINCT r.id) AS total_resources,
  SUM(r.allocated) AS allocated_resources,
  SUM(r.total) AS total_resources_count,
  ROUND(
    CASE 
      WHEN SUM(r.total) > 0 
      THEN (SUM(r.allocated)::NUMERIC / SUM(r.total)::NUMERIC) * 100
      ELSE 0 
    END, 
    2
  ) AS resource_utilization_rate,
  -- Budget metrics (if budget_items table exists)
  COALESCE(SUM(bi.estimated_cost), 0) AS total_budget,
  COALESCE(SUM(bi.actual_cost), 0) AS total_spent,
  ROUND(
    CASE 
      WHEN SUM(bi.estimated_cost) > 0 
      THEN (SUM(COALESCE(bi.actual_cost, 0))::NUMERIC / SUM(bi.estimated_cost)::NUMERIC) * 100
      ELSE 0 
    END, 
    2
  ) AS budget_utilization_rate
FROM events e
LEFT JOIN tasks t ON e.id = t.event_id AND t.archived = false
LEFT JOIN resources r ON e.id = r.event_id
LEFT JOIN budget_items bi ON e.id = bi.event_id AND bi.archived = false
GROUP BY e.id, e.title, e.status, e.start_date, e.end_date, e.location, e.theme_id, e.type_id, e.created_at;

-- Grant access to authenticated users
GRANT SELECT ON event_kpi_view TO authenticated;

-- Add comment
COMMENT ON VIEW event_kpi_view IS 'View providing aggregated KPI metrics for events including task completion, resource utilization, and budget metrics';

