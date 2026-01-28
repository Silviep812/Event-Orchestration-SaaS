
# Corrected Plan: Booking-Style Grid Layout for Resources on Task Cards

## Problem Analysis

The current implementation is wrong because:
1. **Resources displayed vertically** in a scrollable list instead of a horizontal grid
2. **ResourceAssignmentRow component** uses a row-based layout not the tile/card-based pattern from Bookings
3. **No per-resource collaborator field** - the user confirmed each resource needs its own collaborator name entry

## Reference Pattern: BookingsDirectory.tsx (Lines 142-165)

The correct pattern uses:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {options.map((option) => (
    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
      <Checkbox checked={...} onCheckedChange={...} />
      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
        <Icon />
        {label}
      </label>
    </div>
  ))}
</div>
```

## New Layout Structure for Task Cards

```text
+------------------------------------------------------------------+
| Task Title                                          [Priority]   |
| Description                                                      |
| [Task Status Dropdown]                                           |
|                                                                  |
| Resource Category Assignments (grid, 2 columns)                  |
| ┌─────────────────────────┐ ┌─────────────────────────┐          |
| │ ☑ Bookings              │ │ ☐ Vendors               │          |
| │ Status: [Pending ▼]     │ │ Status: [Pending ▼]     │          |
| │ ☑ Confirmed             │ │ ☐ Confirmed             │          |
| │ [Collaborator____][Save]│ │ [Collaborator____][Save]│          |
| └─────────────────────────┘ └─────────────────────────┘          |
| ┌─────────────────────────┐ ┌─────────────────────────┐          |
| │ ☐ Venues                │ │ ☐ Hospitality           │          |
| │ Status: [Pending ▼]     │ │ Status: [Pending ▼]     │          |
| │ ☐ Confirmed             │ │ ☐ Confirmed             │          |
| │ [Collaborator____][Save]│ │ [Collaborator____][Save]│          |
| └─────────────────────────┘ └─────────────────────────┘          |
| ... (remaining 6 resources in grid)                              |
|                                                                  |
|------------------------------------------------------------------|
| Assign Collaborator Task To (task-level, kept)                   |
| [Name__________________________] [Save]                          |
|------------------------------------------------------------------|
| Hours | Due Date | Dependencies                                  |
+------------------------------------------------------------------+
```

## Data Structure Update

Current `resource_assignments` structure:
```json
{
  "Bookings": { "selected": true, "status": "pending", "confirmed": false }
}
```

New structure (add collaborator_name per resource):
```json
{
  "Bookings": { 
    "selected": true, 
    "status": "pending", 
    "confirmed": false,
    "collaborator_name": "John Smith"
  }
}
```

## Files to Modify

### 1. src/components/ResourceAssignmentRow.tsx

Transform from row layout to tile/card layout:

| Current | New |
|---------|-----|
| Single horizontal row | Card-style tile with stacked content |
| No collaborator field | Add collaborator name input + Save button |
| Inline checkbox + dropdown + checkbox | Stacked: checkbox+label at top, status dropdown, confirmation checkbox, collaborator field at bottom |

Update ResourceAssignment interface:
```typescript
export interface ResourceAssignment {
  selected: boolean;
  status: ResourceStatus;
  confirmed: boolean;
  collaborator_name?: string;  // NEW
}
```

### 2. src/components/TaskManager.tsx

**Task Card Section (lines 1621-1679)**:
- Replace the vertical list layout with a 2-column grid
- Wrap `ResourceAssignmentRow` components in `grid grid-cols-1 md:grid-cols-2 gap-3`
- Remove the `max-h-48 overflow-y-auto` scrolling container

**Create/Edit Dialogs**:
- Apply same grid layout change
- Add per-resource collaborator field

### 3. Database Migration

No schema change needed - the `resource_assignments` JSONB column already accepts any structure. The new `collaborator_name` field will be stored as part of each resource object.

## Implementation Details

### ResourceAssignmentRow New Layout

```tsx
<div className="p-3 border rounded-lg hover:bg-muted/50 space-y-2">
  {/* Top row: checkbox + category name */}
  <div className="flex items-center gap-2">
    <Checkbox checked={selected} onCheckedChange={...} />
    <label className="text-sm font-medium cursor-pointer">{category}</label>
  </div>
  
  {/* Status dropdown (enabled when selected) */}
  <Select value={status} disabled={!selected}>
    <SelectTrigger className="h-8 text-xs">...</SelectTrigger>
  </Select>
  
  {/* Confirmation checkbox */}
  <div className="flex items-center gap-2">
    <Checkbox checked={confirmed} disabled={!selected} />
    <label className="text-xs">Confirmed</label>
  </div>
  
  {/* Collaborator name input + Save */}
  <div className="flex gap-1">
    <Input 
      placeholder="Collaborator name" 
      value={collaborator_name}
      disabled={!selected}
      className="h-8 text-xs"
    />
    <Button size="sm" variant="outline" disabled={!selected}>
      <Save className="h-3 w-3" />
    </Button>
  </div>
</div>
```

### Grid Container in TaskManager.tsx

```tsx
{/* Resource Category Assignments - Grid Layout */}
<div className="border-t pt-3 mt-3 space-y-2">
  <p className="text-xs font-semibold">Resource Category Assignments</p>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {RESOURCE_CATEGORIES.map((category) => (
      <ResourceAssignmentTile
        key={category}
        category={category}
        assignment={task.resource_assignments?.[category] || defaultAssignment}
        onAssignmentChange={(newAssignment) => {...}}
      />
    ))}
  </div>
</div>
```

## Summary of Changes

| Component | Change |
|-----------|--------|
| ResourceAssignmentRow.tsx | Convert to tile layout, add collaborator_name field |
| TaskManager.tsx (Task Cards) | Replace vertical list with 2-column grid |
| TaskManager.tsx (Create Dialog) | Apply same grid layout |
| TaskManager.tsx (Edit Dialog) | Apply same grid layout |
| ResourceAssignment interface | Add collaborator_name?: string |
| getEmptyResourceAssignments() | Add collaborator_name: '' default |

## What Stays the Same

- Task-level "Assign Collaborator Task To" field at bottom of card (kept as requested)
- Database schema (JSONB handles new field automatically)
- All 10 resource categories
- Status dropdown options (Pending, Confirmed, Completed, Cancelled)
- Confirmed checkbox behavior
- Auto-save on change
