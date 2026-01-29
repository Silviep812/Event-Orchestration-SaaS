
# Plan: Complete Change Management to Project Management Integration

## Overview

This plan addresses the full integration between Change Management and Project Management, including:
1. Task creation for Accept/Decline workflows (trigger exists but UI not complete)
2. Downstream process adjustments (dependencies, timeline resync)
3. Resource allocation updates (availability, cost tracking)
4. Timeline alignment with conflict monitoring
5. Change log enhancements
6. UI layout fix for overlapping display

---

## Current State Analysis

### What's Already Working
- Database trigger `change_request_to_task_trigger` EXISTS and creates tasks on change request status changes
- Tasks ARE being created with `category = 'Approval'` and `change_request_id` populated
- Example: Task "Review Change Request: Event Update: 1 field changed" was auto-created for pending CR

### What's Missing
1. **UI**: No visual "Approval" badge on task cards in Project Management
2. **UI**: No "View Change Request" link on approval tasks
3. **Interface**: `change_request_id` not in Task TypeScript interface
4. **Downstream**: No automatic dependency resync when changes are applied
5. **Resources**: No cost/availability updates when budget/dates change
6. **Layout**: Change Request UI overlaps with Collaborators tab (needs investigation)

---

## Technical Implementation

### Phase 1: UI Integration in TaskManager

**File: `src/components/TaskManager.tsx`**

1. **Update Task Interface** (line 27-52):
```typescript
interface Task {
  // ... existing fields ...
  change_request_id?: string; // Add link to source change request
}
```

2. **Add Approval Badge** (after line 1555, in card header):
```tsx
{task.category?.includes('Approval') && (
  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
    Approval
  </Badge>
)}
```

3. **Add "View Request" Link** (after line 1578, in card content):
```tsx
{task.change_request_id && (
  <Button
    variant="ghost"
    size="sm"
    className="h-6 text-xs text-purple-600 hover:text-purple-800 p-0"
    onClick={(e) => {
      e.stopPropagation();
      navigate(`/dashboard/change-requests/${task.change_request_id}`);
    }}
  >
    <FileText className="h-3 w-3 mr-1" />
    View Request
  </Button>
)}
```

4. **Update Task Fetch Query** (in `fetchTasks` function):
Include `change_request_id` in the select statement.

---

### Phase 2: Enhanced Trigger for Downstream Updates

**Database Migration: Enhance `apply_change_request` Function**

When a change request is applied, automatically trigger downstream updates:

```sql
-- After applying changes, trigger downstream task updates
CREATE OR REPLACE FUNCTION sync_downstream_on_change_applied()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event_id UUID;
  v_field_changes JSONB;
  v_date_changed BOOLEAN := false;
  v_budget_changed BOOLEAN := false;
BEGIN
  -- Only trigger when status changes to 'applied'
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status 
     AND NEW.status = 'applied' THEN
    
    v_field_changes := NEW.field_changes;
    v_event_id := NEW.event_id::UUID;
    
    -- Check if date fields changed
    IF v_field_changes ? 'start_date' OR v_field_changes ? 'end_date' THEN
      v_date_changed := true;
      
      -- Trigger timeline resync for all tasks in the event
      PERFORM recalculate_project_timeline(v_event_id);
      
      -- Log the resync
      INSERT INTO change_logs (entity_type, entity_id, action, change_description, changed_by)
      VALUES ('event', v_event_id, 'timeline_resync', 
              'Timeline recalculated due to applied change request', 
              NEW.applied_by);
    END IF;
    
    -- Check if budget changed
    IF v_field_changes ? 'budget' THEN
      v_budget_changed := true;
      
      -- Update budget item allocations proportionally (already in apply_change_request)
      -- Log the budget update
      INSERT INTO change_logs (entity_type, entity_id, action, change_description, changed_by)
      VALUES ('event', v_event_id, 'budget_updated', 
              'Budget items recalculated due to applied change request', 
              NEW.applied_by);
    END IF;
    
    -- Update the approval task status to 'completed'
    UPDATE tasks
    SET status = 'completed', updated_at = now()
    WHERE change_request_id = NEW.id
      AND category = 'Approval'
      AND status != 'completed';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_downstream_after_change_applied
  AFTER UPDATE ON change_requests
  FOR EACH ROW
  EXECUTE FUNCTION sync_downstream_on_change_applied();
```

---

### Phase 3: Resource Allocation & Cost Tracking

**Enhance `apply_change_request` Function** (already partially implemented)

Current function already handles:
- Budget scaling for budget_items (lines 262-284 in the function)
- Task due date adjustments when event dates change
- Resource location updates

**Additional Enhancement Needed:**

```sql
-- Add to apply_change_request: Update resource availability tracking
-- After budget updates, log resource cost changes

IF v_new_budget IS NOT NULL THEN
  -- Log each budget item adjustment
  FOR budget_record IN 
    SELECT id, item_name, estimated_cost, 
           estimated_cost * v_budget_ratio as new_cost
    FROM budget_items
    WHERE event_id = v_event_id AND archived = false
  LOOP
    INSERT INTO change_logs (
      entity_type, entity_id, action, field_name, 
      old_value, new_value, change_description, changed_by
    ) VALUES (
      'budget_item', budget_record.id, 'cost_adjusted',
      'estimated_cost',
      budget_record.estimated_cost::text,
      budget_record.new_cost::text,
      'Cost adjusted proportionally due to event budget change',
      p_applied_by
    );
  END LOOP;
END IF;
```

---

### Phase 4: Timeline Conflict Monitoring

**Enhance Trigger to Check for Conflicts:**

```sql
-- Create conflict detection function
CREATE OR REPLACE FUNCTION check_timeline_conflicts(p_event_id UUID)
RETURNS TABLE (
  conflict_type TEXT,
  task_id UUID,
  task_title TEXT,
  conflict_details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check for tasks due after event end date
  RETURN QUERY
  SELECT 
    'TASK_EXCEEDS_EVENT'::TEXT,
    t.id,
    t.title,
    format('Task due date %s exceeds event end date', t.due_date::DATE)
  FROM tasks t
  JOIN events e ON e.id = t.event_id
  WHERE t.event_id = p_event_id
    AND t.due_date::DATE > e.end_date
    AND t.status NOT IN ('completed', 'cancelled');
    
  -- Check for dependency violations
  RETURN QUERY
  SELECT 
    'DEPENDENCY_CONFLICT'::TEXT,
    t.id,
    t.title,
    format('Task depends on "%s" which has later due date', dep.title)
  FROM tasks t
  JOIN tasks_dependencies td ON td.task_id = t.id
  JOIN tasks dep ON dep.id = td.depends_on_task_id
  WHERE t.event_id = p_event_id
    AND t.due_date < dep.due_date
    AND t.status NOT IN ('completed', 'cancelled');
    
  RETURN;
END;
$$;
```

---

### Phase 5: UI Layout Fix

**Issue:** Change Request display overlaps with "Assign Collaborators" area on Project Management page.

**Investigation Needed:** The Project Management page (`src/pages/ProjectManagement.tsx`) uses tabs for Tasks, Budget, and Collaborators. Change Requests are on a separate page (`/dashboard/change-requests`).

**If there's embedded CR display in Project Management:**
- Check for any CR components rendered inside the tabs
- Ensure proper container boundaries with `overflow-hidden` or `max-width`
- Add spacing/margins between sections

**Current Tab Layout (lines 97-124):**
```tsx
<Tabs defaultValue="tasks" className="space-y-6">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="tasks">Tasks</TabsTrigger>
    <TabsTrigger value="budget">Budget</TabsTrigger>
    <TabsTrigger value="roles">Collaborators</TabsTrigger>
  </TabsList>
  // Tab contents...
</Tabs>
```

**Likely Fix:** Add container constraints to each TabsContent:
```tsx
<TabsContent value="roles" className="space-y-4 overflow-hidden">
  <RoleManager selectedEventFilter={selectedEventFilter} />
</TabsContent>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/TaskManager.tsx` | Add `change_request_id` to interface, add Approval badge, add View Request link |
| `src/pages/ProjectManagement.tsx` | Add overflow constraints to fix layout overlap |
| **Database Migration** | Create `sync_downstream_after_change_applied` trigger |
| **Database Migration** | Create `check_timeline_conflicts` function |
| **Database Migration** | Enhance logging for resource cost tracking |

---

## Workflow After Implementation

```text
+--------------------------------+
| Change Request Created         |
| (Status: Pending)              |
+----------------+---------------+
                 |
                 v
+--------------------------------+
| Task Auto-Created:             |
| "Review Change Request: ..."   |
| [Approval badge]               |
| [View Request link]            |
+----------------+---------------+
                 |
       +---------+---------+
       |                   |
       v                   v
  +--------+          +--------+
  | Accept |          | Decline|
  +---+----+          +---+----+
      |                   |
      v                   v
+------------------+  +--------------------+
| Status: Approved |  | Status: Rejected   |
| New Task:        |  | New Task:          |
| "Apply Changes"  |  | "Review Rejection" |
+--------+---------+  +--------------------+
         |
         v
+-----------------------------------+
| Status: Applied                   |
| Downstream Updates Triggered:     |
| - Timeline resync                 |
| - Budget proportional adjust      |
| - Resource availability update    |
| - Dependency conflict check       |
| - Change logs created             |
| - Approval task marked complete   |
+-----------------------------------+
```

---

## Summary of Deliverables

1. **Visual Approval Badge** - Purple badge on task cards for approval workflows
2. **View Request Link** - Direct navigation from task to change request
3. **Automatic Task Completion** - Approval tasks marked complete when CR applied
4. **Timeline Resync** - All tasks recalculated when event dates change
5. **Budget Propagation** - Budget items scaled when event budget changes
6. **Conflict Detection** - Function to identify timeline/dependency conflicts
7. **Enhanced Logging** - All downstream changes logged for audit trail
8. **Layout Fix** - Proper container boundaries to prevent overlap
