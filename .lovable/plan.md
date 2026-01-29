
# Fix Plan: Resource Assignment Panel Layout and Fields Visibility

## Problem Summary
In the Project Management task cards, the Resource Assignments section is displaying incorrectly:
- **5 selected resources** are appearing in **3 containers** (2+2+1 grouping) instead of 5 individual stacked cards
- **Collaborator** and **Dates** fields appear to be missing or hard to see
- **Edits are not saving** to the database

---

## Root Cause Analysis

### Issue 1: "3 Containers" Layout
The `ResourceAssignmentsPanel` renders cards inside `<div className="space-y-2">` which should stack vertically. The "3 containers" issue is likely caused by:
- CSS `overflow-hidden` on parent task card clipping content
- Cards appearing side-by-side due to flex/grid inheritance from parent
- OR misinterpretation: each card looks like a "container" but the grouping is visual due to card styling

### Issue 2: Missing Fields
The `ResourceCard` component includes all required fields (Collaborator, Due/Start/End dates, Status, Confirmed, Dependencies) but:
- Labels use `text-xs text-muted-foreground` which may be too subtle
- Input fields blend into the card background when empty
- The section may be scrollable and fields are out of view

### Issue 3: Edits Not Saving
The debounced save logic in `ResourceCard` (`useEffect` with 500ms timer) may fail because:
- Missing `dependencies` array in fallback assignment objects can cause save failures
- The comparison logic `localValue !== (assignment.value || "")` may not detect changes correctly if values are `undefined`

---

## Implementation Plan

### Step 1: Fix Card Layout - Ensure Vertical Stacking
**File: `src/components/ResourceAssignmentsPanel.tsx`**

Add explicit `flex-col` and prevent horizontal wrapping:
```tsx
// Around line 318
<div className="flex flex-col space-y-3">
  {selectedAssignments.map(([category, assignment]) => (
    <ResourceCard key={category} ... />
  ))}
</div>
```

### Step 2: Improve Field Visibility with Larger Text and Better Contrast
**File: `src/components/ResourceAssignmentsPanel.tsx` (ResourceCard component)**

Increase text sizes and improve label visibility:
- Change labels from `text-xs text-muted-foreground` to `text-sm font-medium text-foreground`
- Increase input heights from `h-7`/`h-8` to `h-9`
- Add placeholder text that's more visible
- Add subtle background color to input fields

### Step 3: Fix the Saving Logic
**File: `src/components/ResourceAssignmentsPanel.tsx`**

Fix the debounced save `useEffect` hooks:
- Add proper dependency arrays
- Ensure the timer cleanup works correctly
- Handle `undefined` values explicitly

**File: `src/components/ResourceColumn.tsx`**

Ensure `getEmptyResourceAssignments` always includes all required fields with proper defaults:
```tsx
// Line 281-298 - confirm dependencies: [] is present (already is, verified)
```

### Step 4: Prevent Overflow Clipping
**File: `src/components/TaskManager.tsx`**

Ensure the task card container allows the expanded panel to display fully:
- Check for any `overflow-hidden` that might clip the expanded content
- Consider `overflow-visible` or `overflow-y-auto` on the collapsible content

---

## Detailed Code Changes

### ResourceAssignmentsPanel.tsx Changes

1. **Line 98-115 (ResourceCard header)**: Make category name larger and more prominent
   - Change `text-sm font-semibold` to `text-base font-bold`

2. **Line 117-127 (Collaborator field)**: Improve visibility
   - Change label to `text-sm font-medium text-foreground`
   - Add `bg-background` to input for contrast
   - Keep `h-8` but add visible placeholder

3. **Line 129-159 (Dates row)**: Improve label visibility
   - Change labels to `text-sm font-medium`
   - Increase date input size consistency

4. **Line 161-193 (Status/Confirmed)**: Keep as-is (dropdowns work correctly)

5. **Line 195-206 (Dependencies)**: Verify label is visible

6. **Line 318 (selectedAssignments container)**: Add `flex flex-col` explicitly

### TaskManager.tsx Changes

Review line ~1600-1800 for any `overflow-hidden` on the task card that might clip the expanded resource panel content.

---

## Expected Result After Fix

Each task card's "Resource Assignments" section will:
1. Display **5 individual cards** stacked vertically (one per selected resource)
2. Each card shows **all 8 fields clearly**:
   - Category name (bold, prominent header)
   - Collaborator (visible input with placeholder)
   - Due/Start/End dates (3-column row, visible labels)
   - Status dropdown
   - Confirmed dropdown
   - Dependencies multi-select
3. **Edits save correctly** with debounced updates to the database

---

## Files to Modify
- `src/components/ResourceAssignmentsPanel.tsx` - Layout and visibility fixes
- `src/components/TaskManager.tsx` - Remove overflow clipping (if present)
- Possibly `src/components/ResourceColumn.tsx` - Verify getEmptyResourceAssignments defaults

---

## Testing Steps
1. Navigate to `/dashboard/project-management`
2. Find a task card with selected resources
3. Click "Resource Assignments" to expand
4. Verify:
   - All 5 resources appear as separate stacked cards
   - Each card shows Collaborator input field with label
   - Each card shows Due/Start/End date fields with labels
   - Status and Confirmed dropdowns are visible
   - Dependencies field is visible
5. Edit a collaborator name and wait 1 second - verify toast appears
6. Refresh page - verify the saved value persists
