

# Plan: Fix Resource Assignments Display in Task Cards

## Problem Identified

The user is seeing 4 task cards on the Project Management page with cluttered, unreadable resource assignment sections. After analyzing the code and database, I've identified these root causes:

1. **Card `overflow-hidden`** - The task Card has `overflow-hidden` which clips the expanded table content
2. **Table in narrow card** - The 8-column table (~840px) tries to fit inside cards that are only 1/3 viewport width (~350-400px)
3. **Double scroll wrapper** - Both the Table component and panel have `overflow-auto`
4. **Collapsed by default** - User may not be seeing the expanded state

---

## Solution: Redesign for Card Context

Since the table layout is too wide for task cards, we need a **compact vertical layout** that fits within the card width while still showing all 8 fields.

### Design: Stacked Resource Cards (within expanded panel)

```text
+------------------------------------------+
| Booking                    [Priority ▼]  |
|------------------------------------------|
| [In Progress ▼]  Assigned: John Doe      |
|------------------------------------------|
| Resource Assignments [2]      [Expand ▼] |
|------------------------------------------|
| ┌──────────────────────────────────────┐ |
| │ BOOKINGS                        [X]  │ |
| │ Collaborator: [___Jane Smith____]    │ |
| │ Due: [04/28] Start: [03/15] End: [03/30] │
| │ Status: [Pending ▼]  Conf: [Y ▼]     │ |
| │ Dependencies: [2 selected]           │ |
| └──────────────────────────────────────┘ |
| ┌──────────────────────────────────────┐ |
| │ VENDORS                         [X]  │ |
| │ Collaborator: [_______________]      │ |
| │ Due: [__/__] Start: [__/__] End: [__/__] │
| │ Status: [Pending ▼]  Conf: [N ▼]     │ |
| │ Dependencies: [0 selected]           │ |
| └──────────────────────────────────────┘ |
| [+ Add Resource ▼]                       |
+------------------------------------------+
```

---

## Technical Changes

### File 1: MODIFY `src/components/ResourceAssignmentsPanel.tsx`

Replace the horizontal table with a vertical stacked card layout:

**Key changes:**
- Remove `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` imports
- Add card-based layout for each resource
- Each resource shows as a small bordered card with all 8 fields in 2-3 rows
- Responsive layout that works within 350px card width

```tsx
// Replace table with stacked cards
{selectedAssignments.map(([category, assignment]) => (
  <div key={category} className="border rounded-md p-3 mb-2 bg-muted/10">
    {/* Header row */}
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-semibold">{category}</span>
      <Button variant="ghost" size="sm" onClick={() => handleRemoveResource(category)}>
        <X className="h-3 w-3" />
      </Button>
    </div>
    
    {/* Collaborator - full width */}
    <div className="mb-2">
      <label className="text-xs text-muted-foreground">Collaborator</label>
      <Input value={assignment.collaborator_name} className="h-8 text-sm" />
    </div>
    
    {/* Dates row - 3 columns */}
    <div className="grid grid-cols-3 gap-2 mb-2">
      <div>
        <label className="text-xs text-muted-foreground">Due</label>
        <Input type="date" className="h-7 text-xs" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Start</label>
        <Input type="date" className="h-7 text-xs" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">End</label>
        <Input type="date" className="h-7 text-xs" />
      </div>
    </div>
    
    {/* Status & Confirmed row */}
    <div className="grid grid-cols-2 gap-2 mb-2">
      <div>
        <label className="text-xs text-muted-foreground">Status</label>
        <Select value={assignment.status}>...</Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Confirmed</label>
        <Select value={assignment.confirmed ? "yes" : "no"}>...</Select>
      </div>
    </div>
    
    {/* Dependencies */}
    <div>
      <label className="text-xs text-muted-foreground">Dependencies</label>
      <DependencyMultiSelect ... />
    </div>
  </div>
))}
```

### File 2: MODIFY `src/components/TaskManager.tsx`

**Line 1581:** Remove `overflow-hidden` from task Card

```tsx
// Before
className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"

// After
className="cursor-pointer hover:shadow-md transition-shadow"
```

### File 3: DELETE `src/components/ResourceAssignmentTableRow.tsx`

This component uses TableRow/TableCell which don't work well in card context. The logic will be moved inline to ResourceAssignmentsPanel with a vertical card layout.

### File 4: KEEP `src/components/DependencyMultiSelect.tsx`

Already works correctly - shows button with count and popover for multi-select.

---

## Complete Field Layout (Per Resource Card)

Each resource assignment card displays ALL 8 fields:

| Row | Fields |
|-----|--------|
| **Header** | Category name + Remove button |
| **Row 1** | Collaborator (full width text input) |
| **Row 2** | Due Date / Start Date / End Date (3 columns) |
| **Row 3** | Status dropdown / Confirmed dropdown (2 columns) |
| **Row 4** | Dependencies multi-select (full width button) |

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/ResourceAssignmentsPanel.tsx` | REWRITE | Replace table with vertical stacked card layout |
| `src/components/TaskManager.tsx` | MODIFY | Remove `overflow-hidden` from task Card (line 1581) |
| `src/components/ResourceAssignmentTableRow.tsx` | DELETE | No longer needed - logic moved to panel |
| `src/components/DependencyMultiSelect.tsx` | KEEP | Works correctly |

---

## Visual Improvement Summary

| Before | After |
|--------|-------|
| 8-column horizontal table crammed into 350px card | Vertical stacked cards, each showing one resource |
| Content clipped by `overflow-hidden` | Full content visible |
| Fields too small to read (text-xs everywhere) | Larger readable text (text-sm) |
| Double scroll containers | Single scroll if needed |
| Table header wastes vertical space | Compact labels above each field |

