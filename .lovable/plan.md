

# Plan: Fix Change Request Position and Add Save All Button for Resource Assignments

## Issues Identified

### Issue 1: Change Request Position Overlap on Project Management Page
After reviewing the code, the "change request" position issue appears to be related to the horizontal scroll containers for Resource Category Assignments on task cards. These expand significantly and can cause visual overflow issues. The current implementation has:
- Task cards with embedded horizontal scroll containers for 10 resource categories
- Each ResourceColumn is 200px minimum width, creating ~2000px of scrollable content
- The `overflow-hidden` was added to `TabsContent` but the task cards themselves may be overflowing their container

The fix requires adding proper containment to the task card resource assignment section to prevent overflow from affecting layout.

### Issue 2: Resource Assignments Need a "Save All" Button
Currently, each resource column has individual save buttons for:
- Collaborator name (Save icon button)
- Dates (Save Dates button)

However, when users edit multiple fields across multiple resource categories, they need to click save multiple times. A "Save All Resources" button would save all resource assignments for a task in one action.

---

## Technical Implementation

### Phase 1: Fix Change Request / Resource Assignment Position Issue

**File: `src/components/TaskManager.tsx`**

The resource assignment section on task cards (lines 1632-1764) needs better containment:

```tsx
{/* Resource Category Assignments - Horizontal Scroll */}
<div className="border-t pt-3 mt-3 space-y-2 max-w-full" onClick={(e) => e.stopPropagation()}>
  <p className="text-xs font-semibold text-foreground">
    Resource Category Assignments
  </p>
  <div className="flex flex-row gap-3 overflow-x-auto pb-2 max-w-full scrollbar-thin">
    {/* ResourceColumn components */}
  </div>
</div>
```

Additionally, ensure the Card component constrains its content properly by adding `overflow-hidden` to the card itself.

### Phase 2: Add "Save All Resources" Button

**File: `src/components/TaskManager.tsx`**

Add a "Save All" button after the horizontal scroll container in task cards:

```tsx
{/* Save All Resources Button */}
<div className="mt-2 flex justify-end">
  <Button
    size="sm"
    variant="default"
    className="h-8 text-xs"
    onClick={async (e) => {
      e.stopPropagation();
      // Save all resource assignments for this task
      await saveAllResourceAssignments(task.id, task.resource_assignments);
    }}
  >
    <Save className="h-3 w-3 mr-1" />
    Save All Resources
  </Button>
</div>
```

Create a new function `saveAllResourceAssignments` to handle bulk saving:

```typescript
const saveAllResourceAssignments = async (
  taskId: string, 
  assignments: Record<string, ResourceAssignment> | undefined
) => {
  if (!assignments) return;
  
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ resource_assignments: JSON.parse(JSON.stringify(assignments)) })
      .eq('id', taskId);
    
    if (error) throw error;
    
    toast({
      title: "All resources saved",
      description: "All resource assignments have been saved successfully.",
    });
  } catch (error) {
    console.error('Error saving all resources:', error);
    toast({
      title: "Error",
      description: "Failed to save resource assignments.",
      variant: "destructive",
    });
    fetchTasks();
  }
};
```

### Phase 3: Add "Save All" to Create and Edit Dialogs

**Create Task Dialog (around line 1369):**
Add a "Save All Entries" button below the resource categories horizontal scroll:

```tsx
<div className="flex justify-end mt-2">
  <Button
    type="button"
    size="sm"
    variant="secondary"
    onClick={() => {
      // All entries are already tracked in resourceAssignments state
      toast({
        title: "Entries saved locally",
        description: "Resource assignments will be saved when you create the task.",
      });
    }}
  >
    <Save className="h-3 w-3 mr-1" />
    Confirm All Entries
  </Button>
</div>
```

**Edit Task Dialog (around line 1902):**
Add the same pattern:

```tsx
<div className="flex justify-end mt-2">
  <Button
    type="button"
    size="sm"
    variant="secondary"
    onClick={() => {
      toast({
        title: "Entries confirmed",
        description: "Resource assignments will be saved when you save the task.",
      });
    }}
  >
    <Save className="h-3 w-3 mr-1" />
    Confirm All Entries
  </Button>
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/TaskManager.tsx` | 1. Add `overflow-hidden` to task cards<br>2. Add `max-w-full` constraints to resource scroll container<br>3. Add `saveAllResourceAssignments` function<br>4. Add "Save All Resources" button on task cards<br>5. Add "Confirm All Entries" button in Create/Edit dialogs |

---

## Summary of Changes

1. **Layout Fix**: Add proper overflow containment to prevent resource assignment columns from causing layout overflow issues on the Project Management page

2. **Save All Button on Task Cards**: Add a "Save All Resources" button that saves all resource assignments in one action, reducing the number of clicks needed

3. **Confirm All Button in Dialogs**: Add confirmation buttons in Create and Edit dialogs to give users feedback that their entries are tracked before final submission

---

## Expected Outcome

After implementation:
- Resource assignment sections will be properly contained and won't cause layout issues
- Users can click one button to save all resource assignments for a task
- Create/Edit dialogs provide clear confirmation that entries are being tracked
- Reduced friction for users managing multiple resource categories

