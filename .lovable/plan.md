

# Fix: Change Management to Project Management Integration

## Problem Identified

After thorough investigation of the database, triggers, and frontend code, I found the following:

### Current State

| Component | Status | Finding |
|-----------|--------|---------|
| Trigger Function | EXISTS | `create_approval_task_on_change_request()` is in database |
| Database Trigger | EXISTS & ENABLED | `change_request_to_task_trigger` on `change_requests` table |
| `change_request_id` Column | EXISTS | Added to `tasks` table |
| Approval Tasks Created | NONE | No tasks with `category = 'Approval'` exist |

### Root Cause

1. **Timing Issue**: The trigger was deployed on **2026-01-29** (today), but the last change request activity was on **2026-01-21** (8 days ago)
2. **No new change requests tested**: Since the trigger deployment, no new change requests have been created or had their status updated

The user mentions "Before it did process a request in the change request side...didn't process in the PM side. Now nothing" - this suggests there may also be an issue with the **frontend change request creation flow** that is preventing new requests from being submitted.

## Solution

### Phase 1: Verify Trigger is Working (Database Fix)

Create a small verification migration to ensure the trigger is properly firing:

```text
Files: supabase/migrations/[timestamp]_verify_change_request_trigger.sql
```

**SQL Migration:**
- Drop and recreate the trigger to ensure it's properly attached
- Add logging to verify trigger execution
- Ensure the function handles edge cases (null values, invalid UUIDs)

### Phase 2: Fix Potential Frontend Issues (Code Changes)

Review and fix the ManageEvent.tsx change request submission:

```text
File: src/components/ManageEvent.tsx
```

**Changes:**
1. Add better error handling and console logging for debugging
2. Ensure the change request insert properly includes all required fields
3. Add a toast notification when the trigger creates a task (optional)

### Phase 3: Verify TaskManager UI (Code Changes)

Ensure the "Approval" category tasks are visible:

```text
File: src/components/TaskManager.tsx
```

**Verification:**
- Confirm tasks with `category = 'Approval'` are fetched and displayed
- Ensure the purple "Approval" badge renders correctly
- Add filtering option for "Approval" category tasks

## Implementation Steps

### Step 1: Database Migration

Create a new migration that:
1. Recreates the trigger to ensure it's properly attached
2. Adds a simple test to verify trigger execution works

```sql
-- Drop and recreate trigger to ensure clean state
DROP TRIGGER IF EXISTS change_request_to_task_trigger ON public.change_requests;

CREATE TRIGGER change_request_to_task_trigger
  AFTER INSERT OR UPDATE ON public.change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_approval_task_on_change_request();

-- No additional changes needed - function already exists and is correct
```

### Step 2: Frontend Debugging

Add console logging to trace the change request flow:

```tsx
// In submitChangeRequest function
console.log('[Change Request] Starting submission with pendingChanges:', pendingChanges);
console.log('[Change Request] Event ID:', selectedEvent?.id);
console.log('[Change Request] User ID:', user?.id);

// After successful insert
console.log('[Change Request] Created successfully:', createdTask);
console.log('[Change Request] Trigger should now create approval task');
```

### Step 3: Test End-to-End

After applying the fix:

1. Navigate to Manage Event page
2. Select an event and make a change (e.g., change title)
3. Click "Request Change" button
4. Verify:
   - Change request appears in Change Management page with "pending" status
   - Task with title "Review Change Request: [title]" appears in Project Management
   - Task has "Approval" category badge (purple)
5. Approve the change request
6. Verify:
   - New task "Apply Approved Changes: [title]" is created
   - Original review task remains

## Technical Details

### Trigger Logic

The trigger fires on:
- **INSERT with status='pending'**: Creates "Review Change Request" task
- **UPDATE to status='approved'**: Creates "Apply Approved Changes" task  
- **UPDATE to status='rejected'**: Creates "Review Rejected Request" task

### Task Properties for Approval Category

| Property | Value |
|----------|-------|
| `category` | `'Approval'` |
| `change_request_id` | UUID link to source change request |
| `priority` | Inherits from change request (default: medium) |
| `due_date` | +2 days (pending), +3 days (approved), +7 days (rejected) |
| `status` | `'not_started'` |

### Expected Outcome

After this fix:
1. Change requests will automatically create corresponding tasks in Project Management
2. Tasks will be visually distinct with purple "Approval" badge
3. Full traceability between Change Management and Project Management systems

