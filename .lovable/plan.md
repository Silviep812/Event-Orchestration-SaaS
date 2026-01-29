

# Plan: Add Dependencies Field to ResourceCard + Improve Readability

## Understanding the Current Structure

The current implementation is correct in structure:
- Each of the 10 resource categories (Bookings, Vendors, Venues, etc.) is displayed as a **separate card**
- Cards are arranged in a responsive grid (1-4 columns based on screen size)
- Each card contains its own fields for that specific resource assignment

**What's Missing:**
1. **Dependencies field** - Each resource card should have a dropdown to select task dependencies
2. **Readability** - Text sizes are too small to read comfortably

---

## Technical Changes

### File 1: `src/components/ResourceColumn.tsx`

**Update ResourceAssignment interface (lines 10-18):**

Add `dependencies` field to track task dependencies per resource:

```typescript
export interface ResourceAssignment {
  selected: boolean;
  status: ResourceStatus;
  confirmed: boolean;
  collaborator_name?: string;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  dependencies?: string[];  // NEW: Array of task IDs
}
```

**Update getEmptyResourceAssignments (lines 280-296):**

Include empty dependencies array in default assignments.

---

### File 2: `src/components/ResourceCard.tsx`

**1. Add Props for Dependencies:**

```typescript
interface ResourceCardProps {
  category: string;
  assignment: ResourceAssignment;
  onAssignmentChange: (assignment: ResourceAssignment) => void;
  onCollaboratorSave?: (collaboratorName: string) => void;
  onDatesSave?: (dates: { due_date?: string; start_date?: string; end_date?: string }) => void;
  availableTasks?: Array<{ id: string; title: string }>;  // NEW
  onDependenciesChange?: (dependencies: string[]) => void;  // NEW
}
```

**2. Add Dependencies UI Section (after Timeline):**

```tsx
{/* Dependencies Section */}
<div className="space-y-1 mt-3">
  <label className="text-sm text-muted-foreground">Dependencies</label>
  <Select
    value={assignment.dependencies?.[0] || 'none'}
    onValueChange={(value) => {
      const newDeps = value === 'none' ? [] : [value];
      onAssignmentChange({
        ...assignment,
        dependencies: newDeps
      });
    }}
    disabled={!assignment.selected}
  >
    <SelectTrigger className="h-9 w-full text-sm">
      <SelectValue placeholder="Select dependency" />
    </SelectTrigger>
    <SelectContent className="bg-card border shadow-md z-[100]">
      <SelectItem value="none">None</SelectItem>
      {availableTasks?.map(task => (
        <SelectItem key={task.id} value={task.id}>
          {task.title}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**3. Readability Improvements (already partially applied):**

The previous edit already increased sizes. We'll ensure consistency:
- Card padding: `p-4` 
- Category label: `text-base font-semibold`
- Field labels: `text-sm`
- Select triggers: `h-9 text-sm`
- Inputs: `h-9 text-sm`
- Date inputs: `h-8 text-sm`

---

### File 3: `src/components/TaskManager.tsx`

**Pass availableTasks to ResourceCard (lines 1697-1815):**

```tsx
<ResourceCard
  key={category}
  category={category}
  assignment={currentAssignment}
  availableTasks={availableTasks.filter(t => t.id !== task.id)}  // NEW
  onAssignmentChange={...}
  onCollaboratorSave={...}
  onDatesSave={...}
/>
```

---

## Updated ResourceCard Layout

Each of the 10 resource cards will display with this structure:

```text
┌─────────────────────────────────────────┐
│ ☑ Bookings                              │  ← 16px category name
│─────────────────────────────────────────│
│                                         │
│ Status           Confirmed              │  ← 14px labels
│ [Pending ▼]      [No ▼]                 │  ← 36px dropdowns
│                                         │
│ Task Assigned To                        │  ← 14px bold label
│ [_______________________________]       │  ← 36px input
│                                         │
│ Timeline                                │  ← 14px label
│ Due         Start        End            │  ← 12px sub-labels
│ [________]  [________]  [________]      │  ← 32px date inputs
│                                         │
│ Dependencies                            │  ← 14px label (NEW)
│ [Select dependency ▼]                   │  ← 36px dropdown (NEW)
└─────────────────────────────────────────┘
```

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/components/ResourceColumn.tsx` | Add `dependencies?: string[]` to ResourceAssignment interface; Update helper functions |
| `src/components/ResourceCard.tsx` | Add availableTasks prop; Add Dependencies dropdown section; Ensure readability sizing |
| `src/components/TaskManager.tsx` | Pass availableTasks prop to each ResourceCard |

---

## Complete Field List Per Resource Card

After this update, each of the 10 resource assignment cards will have:

| Field | Type | Description |
|-------|------|-------------|
| Resource Selection | Checkbox | Select this resource category |
| Status | Dropdown | Pending/Confirmed/Completed/Cancelled |
| Confirmed | Dropdown | Yes/No confirmation |
| Task Assigned To | Text Input | Collaborator name |
| Due Date | Date Input | Task due date |
| Start Date | Date Input | Task start date |
| End Date | Date Input | Task end date |
| Dependencies | Dropdown | Select task dependency (NEW) |

All displayed with readable 14-16px text and comfortable 32-36px input heights.

