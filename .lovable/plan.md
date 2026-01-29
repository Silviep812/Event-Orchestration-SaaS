
# Fix Plan: Resource Assignment Panel - Layout and Saving Issues

## Problem Summary
In the Project Management task cards, the Resource Assignments section has two issues:
1. **Layout Issue**: Selected resources appear grouped into "containers" (2+2+1) instead of 5 individual stacked cards
2. **Saving Issue**: Resource changes are not persisting to the database

## Root Cause Analysis

### Issue 1: Visual Grouping
After reviewing the code, the `ResourceAssignmentsPanel` component structure is:
- `CollapsibleContent` wrapping a `<div className="pb-3">`
- Inside: `<div className="flex flex-col gap-3 w-full">` 
- Each resource wrapped in `<div className="w-full block">`
- Each `ResourceCard` has its own `border rounded-lg p-4 bg-card shadow-sm`

The "container grouping" visual issue is likely caused by:
- **CSS inheritance from parent grid**: The task cards are in a `grid gap-4 md:grid-cols-2 lg:grid-cols-3` layout which may affect nested flex containers
- **Collapsible animation interference**: Radix CollapsibleContent may apply hidden overflow or transform styles that affect layout
- **Missing isolation styles**: The flex container needs explicit `isolate` or `overflow-visible` to prevent CSS conflicts

### Issue 2: Saves Not Persisting
Looking at the database:
- The "Review Change Request" task only has 1 resource (`Bookings`) saved, not 5
- The save handler (`onAssignmentChange`) calls `supabase.from('tasks').update(...)` 

Possible causes:
- **Race conditions**: Multiple rapid selections may overwrite each other
- **Toast suppressing errors**: The try/catch shows "Resource updated" but may hide failures
- **State not syncing**: Local state updates before DB confirmation, then DB fails silently

## Implementation Plan

### Step 1: Fix Layout - Add Isolation and Force Column Layout
**File: `src/components/ResourceAssignmentsPanel.tsx`**

Modify the container that holds resource cards to use proper isolation:

```tsx
// Line 318: Change the container classes
<div className="flex flex-col gap-3 w-full isolate" style={{ contain: 'layout' }}>
```

Also add explicit display styles to each wrapper:

```tsx
// Line 320: Ensure each card is truly a block element
<div key={category} className="w-full block" style={{ display: 'block' }}>
```

### Step 2: Fix Saving - Add Await and Better Error Handling
**File: `src/components/TaskManager.tsx`**

The `onAssignmentChange` handler at line 1673 updates local state first, then tries to save. If save fails, it should revert. We need to:

1. Add console logging to debug what's being saved
2. Ensure the full resource_assignments object is being sent, not just the changed category
3. Add a retry mechanism or clearer error feedback

```tsx
// Around line 1687-1707
try {
  console.log('Saving resource assignments:', updatedAssignments);
  const { error, data } = await supabase
    .from('tasks')
    .update({ resource_assignments: JSON.parse(JSON.stringify(updatedAssignments)) })
    .eq('id', task.id)
    .select();
  
  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }
  
  console.log('Save successful:', data);
  toast({ title: "Resource updated", description: `${category} assignment updated.` });
} catch (error) {
  console.error('Error updating resource assignment:', error);
  toast({ title: "Error", description: "Failed to update resource. Please try again.", variant: "destructive" });
  // Revert local state
  fetchTasks();
}
```

### Step 3: Fix CollapsibleContent Overflow
**File: `src/components/ResourceAssignmentsPanel.tsx`**

Add overflow-visible to prevent clipping:

```tsx
// Line 311: Add className to CollapsibleContent wrapper
<CollapsibleContent className="overflow-visible">
  <div className="pb-3 overflow-visible">
```

### Step 4: Ensure ResourceCard Has Proper Stacking Context
**File: `src/components/ResourceAssignmentsPanel.tsx`**

Modify the ResourceCard wrapper:

```tsx
// Line 99: Add relative positioning and z-index
<div className="border rounded-lg p-4 bg-card shadow-sm relative">
```

## Technical Details

### Files to Modify
1. `src/components/ResourceAssignmentsPanel.tsx`
   - Line 99: Add `relative` to card class
   - Line 311: Add `overflow-visible` to CollapsibleContent
   - Line 312: Add `overflow-visible` to inner wrapper
   - Line 318: Add `isolate` and inline `contain: layout` style
   - Line 320: Add inline `display: block` style

2. `src/components/TaskManager.tsx`
   - Lines 1687-1707: Add console.log for debugging saves
   - Add `.select()` after update to get confirmation
   - Improve error messaging

### Testing Steps
1. Navigate to `/dashboard/project-management`
2. Find the "Review Change Request" task (or any task)
3. Click "Resource Assignments" to expand
4. Click "Add Resource" and select 5 different resources
5. Verify:
   - All 5 appear as separate stacked cards (not grouped)
   - Each card shows all fields (Collaborator, Due/Start/End, Status, Confirmed, Dependencies)
6. Open browser DevTools Console
7. Edit a collaborator name and watch for console logs
8. Refresh the page
9. Verify the 5 resources are still there with your edits

## Expected Outcome
- Each selected resource displays as its own distinct, full-width card
- Cards stack vertically with 12px (gap-3) spacing between them
- All fields are visible and editable
- Changes save to the database with confirmation
- Console logs help identify any remaining save issues
