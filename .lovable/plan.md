

# Plan: Redesign Resource Category Assignments to 3-4 Column Grid Layout

## Problem Identified

The current horizontal scroll layout for Resource Category Assignments:
- Uses 10 inline columns (each 200px min-width = ~2000px total)
- Requires horizontal scrolling to see all categories
- Information gets "lost" as users must scroll to find entries
- Not user-friendly for viewing all assignment details at once

## Solution

Replace the horizontal scroll layout with a **responsive 3-4 column grid** that displays all resource assignment details visibly without horizontal scrolling.

---

## New Layout Design

```text
CURRENT: Horizontal Scroll (entries get lost)
┌─────────────────────────────────────────────────────────────────────►
│ [Bookings] │ [Vendors] │ [Venues] │ [Hospitality] │ ... (scroll to see more)
└─────────────────────────────────────────────────────────────────────►

PROPOSED: 3-4 Column Grid (all visible)
┌────────────────────────────────────────────────────────────────┐
│  [Bookings]        [Vendors]         [Venues]        [Hospitality]  │
│  ☑ Status: Pending ☐ Status: N/A     ☑ Status: OK   ☑ Status: Pending│
│  Assignee: John    Assignee: -       Assignee: Jane  Assignee: Mike │
│  Due: Jan 30       Due: -            Due: Feb 1      Due: Feb 5     │
├────────────────────────────────────────────────────────────────┤
│  [Vendor Service]  [Service Vendor]  [Transport]    [Entertainment] │
│  ☐ Status: N/A     ☑ Status: Conf    ☐ Status: N/A  ☐ Status: N/A   │
│  Assignee: -       Assignee: Pat     Assignee: -    Assignee: -     │
│  Due: -            Due: Jan 31       Due: -         Due: -          │
├────────────────────────────────────────────────────────────────┤
│  [Suppliers]       [Marketing]                                      │
│  ☐ Status: N/A     ☐ Status: N/A                                    │
│  Assignee: -       Assignee: -                                      │
│  Due: -            Due: -                                           │
└────────────────────────────────────────────────────────────────┘
                                          [Save All Resources]
```

---

## Technical Implementation

### Phase 1: Create Compact ResourceCard Component

Create a new `ResourceCard` component (or modify `ResourceColumn`) that displays in a more compact, card-based format suitable for a grid:

**New Component: `src/components/ResourceCard.tsx`**

```tsx
// Compact card for grid display - shows all details in condensed format
interface ResourceCardProps {
  category: string;
  assignment: ResourceAssignment;
  onAssignmentChange: (assignment: ResourceAssignment) => void;
  onCollaboratorSave?: (collaboratorName: string) => void;
  onDatesSave?: (dates: { due_date?: string; start_date?: string; end_date?: string }) => void;
}

export function ResourceCard({ category, assignment, ... }: ResourceCardProps) {
  return (
    <div className="border rounded-lg p-3 bg-card">
      {/* Header with checkbox and category name */}
      <div className="flex items-center gap-2 border-b pb-2 mb-2">
        <Checkbox checked={assignment.selected} ... />
        <span className="text-sm font-semibold">{category}</span>
      </div>
      
      {/* Compact details grid - 2 columns within each card */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Status */}
        <div>
          <label className="text-muted-foreground">Status</label>
          <Select value={assignment.status} ... />
        </div>
        
        {/* Confirmation */}
        <div>
          <label className="text-muted-foreground">Confirmed</label>
          <Select value={assignment.confirmed ? 'yes' : 'no'} ... />
        </div>
      </div>
      
      {/* Task Assigned To - full width */}
      <div className="mt-2">
        <label className="text-xs font-semibold">Task Assigned To</label>
        <Input placeholder="Collaborator name" value={...} className="h-7 text-xs" />
      </div>
      
      {/* Timeline - compact display */}
      <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
        <div>
          <label className="text-muted-foreground">Due</label>
          <Input type="date" value={...} className="h-6 text-xs" />
        </div>
        <div>
          <label className="text-muted-foreground">Start</label>
          <Input type="date" value={...} className="h-6 text-xs" />
        </div>
        <div>
          <label className="text-muted-foreground">End</label>
          <Input type="date" value={...} className="h-6 text-xs" />
        </div>
      </div>
    </div>
  );
}
```

### Phase 2: Update TaskManager Layout

**File: `src/components/TaskManager.tsx`**

Replace the horizontal scroll (lines 1684-1831) with a responsive grid:

```tsx
{/* Resource Category Assignments - Grid Layout */}
<div className="border-t pt-3 mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
  <p className="text-xs font-semibold text-foreground">
    Resource Category Assignments
  </p>
  
  {/* Responsive Grid: 1 col on mobile, 2 on sm, 3 on md, 4 on lg */}
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {RESOURCE_CATEGORIES.map((category) => {
      const currentAssignment = task.resource_assignments?.[category] || {...};
      return (
        <ResourceCard
          key={category}
          category={category}
          assignment={currentAssignment}
          onAssignmentChange={...}
          onCollaboratorSave={...}
          onDatesSave={...}
        />
      );
    })}
  </div>
  
  {/* Save All Resources Button */}
  <div className="mt-3 flex justify-end">
    <Button size="sm" onClick={() => saveAllResourceAssignments(...)}>
      <Save className="h-3 w-3 mr-1" />
      Save All Resources
    </Button>
  </div>
</div>
```

### Phase 3: Apply Same Layout to Create/Edit Dialogs

Update the Create Task and Edit Task dialogs to use the same grid layout for consistency.

---

## Responsive Breakpoints

| Screen Size | Columns | Visual |
|-------------|---------|--------|
| Mobile (<640px) | 1 column | Stack vertically |
| Small (640px+) | 2 columns | 5 rows of 2 |
| Medium (768px+) | 3 columns | ~3-4 rows of 3 |
| Large (1024px+) | 4 columns | ~3 rows of 4 |

---

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/components/ResourceCard.tsx` | **NEW** - Compact card component for grid display |
| `src/components/TaskManager.tsx` | Replace horizontal scroll with responsive grid layout in task cards |
| `src/components/TaskManager.tsx` | Update Create Task dialog to use grid layout |
| `src/components/TaskManager.tsx` | Update Edit Task dialog to use grid layout |

---

## Benefits

1. **All Entries Visible** - No horizontal scrolling needed, all 10 categories visible in 3-4 columns
2. **Complete Details Shown** - Each card displays: checkbox, status, confirmation, assignee, and all 3 dates
3. **Responsive Design** - Adapts from 1 to 4 columns based on screen size
4. **Better Scannability** - Grid layout makes it easy to compare assignments across categories
5. **Consistent Experience** - Same layout in task cards and dialogs

---

## Summary

- Create new `ResourceCard` component optimized for grid display
- Replace horizontal scroll with `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- All 10 resource categories visible without scrolling
- Each card shows complete assignment details (status, confirmation, assignee, timeline)
- "Save All Resources" button preserved at the bottom

