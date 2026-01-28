

# Corrected Plan: Horizontal Resource Columns Layout

## Problem Understanding

The current implementation is **wrong** in a fundamental way:

**Current (Incorrect)**:
- 2-column grid of tiles
- Each tile repeats the same structure (checkbox + status + confirmed + collaborator)
- Resources stack vertically, filling the grid

**What You Actually Want**:
- **Horizontal columns** where each column is a DIFFERENT resource type
- Each column contains the SAME data flow from top to bottom
- 3 columns visible at a time (scrollable for remaining 7 resources)

## Correct Layout Structure

```
+-------------------+-------------------+-------------------+
|     BOOKINGS      |      VENUE        |   HOSPITALITY     |  (scroll →)
+-------------------+-------------------+-------------------+
| Status:           | Status:           | Status:           |
| [Pending ▼]       | [Pending ▼]       | [Pending ▼]       |
+-------------------+-------------------+-------------------+
| Confirmation:     | Confirmation:     | Confirmation:     |
| [Dropdown ▼]      | [Dropdown ▼]      | [Dropdown ▼]      |
+-------------------+-------------------+-------------------+
| Task Assigned To: | Task Assigned To: | Task Assigned To: |
| [Name_____][Save] | [Name_____][Save] | [Name_____][Save] |
+-------------------+-------------------+-------------------+
| Timeline/Dates:   | Timeline/Dates:   | Timeline/Dates:   |
| Due: [date]       | Due: [date]       | Due: [date]       |
| Start: [date]     | Start: [date]     | Start: [date]     |
| End: [date]       | End: [date]       | End: [date]       |
+-------------------+-------------------+-------------------+
```

**Key Differences**:
- Each **column header** is a resource name (Bookings, Venue, etc.)
- Each **row** is a data type (Status, Confirmation, Collaborator, Dates)
- 3 columns visible at once with horizontal scroll for all 10 resources

## Data Structure Update

Each resource needs its own dates/timeline, so the `ResourceAssignment` interface expands:

```typescript
export interface ResourceAssignment {
  selected: boolean;
  status: ResourceStatus;
  confirmed: boolean;
  collaborator_name?: string;
  // NEW: Per-resource timeline/dates
  due_date?: string;
  start_date?: string;
  end_date?: string;
}
```

## Files to Modify

### 1. src/components/ResourceAssignmentRow.tsx

- Rename to `ResourceColumn.tsx` (or keep name but restructure)
- Change from a tile/card layout to a **column** layout
- Add date fields (due, start, end) per resource
- Structure as vertical stack: Header → Status → Confirmation → Collaborator → Dates

### 2. src/components/TaskManager.tsx

- Replace 2-column grid with **horizontal scrollable container**
- Use `flex flex-row overflow-x-auto` to display columns side by side
- Each resource becomes a column (not a tile in a grid)
- Remove the separate "Resource Category Assignments" section header tiles

## New Component Structure

**ResourceColumn Component (replaces ResourceAssignmentRow)**:

```tsx
<div className="min-w-[200px] border rounded-lg p-3 flex-shrink-0">
  {/* Column Header - Resource Name */}
  <div className="font-semibold text-sm border-b pb-2 mb-2">
    <Checkbox checked={selected} /> Bookings
  </div>
  
  {/* Status Row */}
  <div className="space-y-1 mb-3">
    <label className="text-xs text-muted-foreground">Status</label>
    <Select value={status}>...</Select>
  </div>
  
  {/* Confirmation Row */}
  <div className="space-y-1 mb-3">
    <label className="text-xs text-muted-foreground">Confirmation</label>
    <Select value={confirmed ? 'yes' : 'no'}>
      <SelectItem value="yes">Confirmed</SelectItem>
      <SelectItem value="no">Not Confirmed</SelectItem>
    </Select>
  </div>
  
  {/* Task Assigned To / Collaborator Row */}
  <div className="space-y-1 mb-3">
    <label className="text-xs text-muted-foreground">Task Assigned To</label>
    <div className="flex gap-1">
      <Input value={collaborator_name} />
      <Button><Save /></Button>
    </div>
  </div>
  
  {/* Timeline/Dates Row */}
  <div className="space-y-2">
    <label className="text-xs text-muted-foreground">Timeline</label>
    <div className="space-y-1">
      <Input type="date" label="Due" value={due_date} />
      <Input type="date" label="Start" value={start_date} />
      <Input type="date" label="End" value={end_date} />
    </div>
  </div>
</div>
```

**TaskManager Container**:

```tsx
{/* Resource Columns - Horizontal Scroll */}
<div className="border-t pt-3 mt-3">
  <p className="text-xs font-semibold mb-2">Resource Category Assignments</p>
  <div className="flex flex-row gap-3 overflow-x-auto pb-2">
    {RESOURCE_CATEGORIES.map((category) => (
      <ResourceColumn
        key={category}
        category={category}
        assignment={task.resource_assignments?.[category]}
        onAssignmentChange={...}
        onCollaboratorSave={...}
      />
    ))}
  </div>
</div>
```

## Summary of Changes

| Component | Current | New |
|-----------|---------|-----|
| Layout Direction | Vertical grid (2 cols) | Horizontal scroll (3+ visible) |
| Resource Display | Tile with stacked elements | Column with labeled rows |
| Confirmation | Checkbox | Dropdown (option menu) |
| Dates | None per resource | Due/Start/End per resource |
| Container | `grid grid-cols-1 md:grid-cols-2` | `flex flex-row overflow-x-auto` |

## Technical Notes

- Horizontal scroll container uses `overflow-x-auto` with `flex-shrink-0` on children
- Each column has `min-w-[200px]` to ensure consistent width
- Confirmation changes from checkbox to dropdown per user request
- Timeline/dates stored per resource in the JSONB `resource_assignments` column
- Task-level "Assign Collaborator Task To" field remains at bottom of card

