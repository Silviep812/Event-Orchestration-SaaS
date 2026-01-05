-- Create view for event task timeline with constraint analysis
CREATE OR REPLACE VIEW event_task_timeline_view AS
SELECT 
  t.id AS task_id,
  t.event_id,
  t.title,
  t.description,
  t.due_date,
  t.start_date,
  t.end_date,
  t.start_time,
  t.end_time,
  t.estimated_hours,
  t.actual_hours,
  t.status,
  t.priority,
  t.assigned_to,
  t.created_at,
  t.updated_at,
  e.start_date AS event_start_date,
  e.end_date AS event_end_date,
  e.location AS event_location,
  e.title AS event_title,
  -- Calculate if task is overdue (due_date < NOW() and not completed/cancelled)
  CASE 
    WHEN t.due_date < NOW() AND t.status NOT IN ('completed', 'cancelled') 
    THEN true 
    ELSE false 
  END AS is_overdue,
  -- Calculate if task is misaligned (due_date > event end_date)
  CASE 
    WHEN t.due_date IS NOT NULL AND e.end_date IS NOT NULL AND t.due_date > e.end_date 
    THEN true 
    ELSE false 
  END AS is_misaligned
FROM tasks t
JOIN events e ON t.event_id = e.id;

-- Grant access to authenticated users
GRANT SELECT ON event_task_timeline_view TO authenticated;

-- Add comment
COMMENT ON VIEW event_task_timeline_view IS 'View providing task timeline information with overdue and misaligned flags for constraint analysis';

