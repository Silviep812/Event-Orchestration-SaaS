
# Plan: Integrate Change Management Approvals with Project Management Tasks

## Problem Statement

Currently, when a Change Request is approved, rejected, or applied in the Change Management system, there is no corresponding entry created in the Project Management / Task Manager. This means:

1. Coordinators and team members cannot see approval-related activities as tasks
2. There is no visibility into pending approvals from the Project Management view
3. Accept/Decline decisions are not tracked as actionable items in the task workflow

## Solution Overview

Automatically create tasks in Project Management when:
1. A Change Request is **approved** - creates an "Apply Changes" task
2. A Change Request is **rejected** - creates a "Review Rejection" notification task
3. A Change Request is **created** (pending) - optionally creates a "Review & Approve" task for coordinators

## Technical Implementation

### 1. Database Trigger Function

Create a new PostgreSQL trigger function that fires when a `change_request` status changes:

```sql
CREATE OR REPLACE FUNCTION create_approval_task_on_change_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_task_title TEXT;
  v_task_description TEXT;
  v_task_priority TEXT;
  v_event_id UUID;
BEGIN
  -- Only trigger on status changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Convert event_id to UUID if it's a valid UUID format
    IF NEW.event_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_event_id := NEW.event_id::UUID;
    ELSE
      v_event_id := NULL;
    END IF;
    
    -- Handle approved status
    IF NEW.status = 'approved' THEN
      v_task_title := 'Apply Approved Changes: ' || NEW.title;
      v_task_description := 'Change request approved. Apply the changes to complete this workflow.';
      v_task_priority := COALESCE(NEW.priority, 'medium');
      
      INSERT INTO tasks (
        title, description, status, priority, event_id, 
        created_by, category, due_date
      ) VALUES (
        v_task_title,
        v_task_description,
        'not_started',
        v_task_priority::task_priority,
        v_event_id,
        COALESCE(NEW.approved_by, NEW.requested_by),
        'Approval',
        NOW() + INTERVAL '3 days'
      );
    
    -- Handle rejected status
    ELSIF NEW.status = 'rejected' THEN
      v_task_title := 'Review Rejected Request: ' || NEW.title;
      v_task_description := 'Change request was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided');
      
      INSERT INTO tasks (
        title, description, status, priority, event_id,
        created_by, category, due_date
      ) VALUES (
        v_task_title,
        v_task_description,
        'not_started',
        'medium'::task_priority,
        v_event_id,
        NEW.requested_by,
        'Approval',
        NOW() + INTERVAL '7 days'
      );
    END IF;
  
  -- Handle new pending change requests
  ELSIF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    IF NEW.event_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      v_event_id := NEW.event_id::UUID;
    ELSE
      v_event_id := NULL;
    END IF;
    
    v_task_title := 'Review Change Request: ' || NEW.title;
    v_task_description := 'A new change request requires your review. Accept or Decline.';
    v_task_priority := COALESCE(NEW.priority, 'medium');
    
    INSERT INTO tasks (
      title, description, status, priority, event_id,
      created_by, category, due_date
    ) VALUES (
      v_task_title,
      v_task_description,
      'not_started',
      v_task_priority::task_priority,
      v_event_id,
      NEW.requested_by,
      'Approval',
      NOW() + INTERVAL '2 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$;
```

### 2. Create Database Trigger

```sql
CREATE TRIGGER change_request_to_task_trigger
  AFTER INSERT OR UPDATE ON change_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_approval_task_on_change_request();
```

### 3. Task Category for Approvals

Add "Approval" as a recognized task category in the UI to filter and identify approval-related tasks.

### 4. UI Enhancement: Task Cards with Approval Badge

Update `TaskManager.tsx` to show a special badge for tasks with `category = 'Approval'` to make them visually distinct.

### 5. Link Tasks to Change Requests

Add a `change_request_id` column to the `tasks` table to link approval tasks back to their source change request:

```sql
ALTER TABLE tasks 
ADD COLUMN change_request_id UUID REFERENCES change_requests(id) ON DELETE SET NULL;
```

Update the trigger to populate this column, enabling navigation from task to change request.

## Files to Modify

| File | Change |
|------|--------|
| **Migration** | Create trigger function, trigger, and add `change_request_id` column |
| `src/components/TaskManager.tsx` | Add "Approval" category badge, show link to change request |
| `src/components/ResourceColumn.tsx` | Add "Approval" to RESOURCE_CATEGORIES if needed |

## Workflow Summary

```
+---------------------------+
| Change Request Created    |
| (Status: pending)         |
+-------------+-------------+
              |
              v
+---------------------------+
| Task Created:             |
| "Review Change Request"   |
| Category: Approval        |
+-------------+-------------+
              |
    +---------+---------+
    |                   |
    v                   v
+--------+         +--------+
| Accept |         | Decline|
+---+----+         +---+----+
    |                  |
    v                  v
+------------------+  +--------------------+
| Task Created:    |  | Task Created:      |
| "Apply Approved  |  | "Review Rejected   |
|  Changes"        |  |  Request"          |
+------------------+  +--------------------+
```

## Benefits

1. **Full Visibility**: All change request activities appear as tasks in Project Management
2. **Accountability**: Approval tasks are assigned and tracked with due dates
3. **Workflow Integration**: Seamlessly connects Change Management with Project Management
4. **Filtering**: "Approval" category allows filtering to see only approval-related work
5. **Navigation**: Direct link from task to the change request for easy context switching
