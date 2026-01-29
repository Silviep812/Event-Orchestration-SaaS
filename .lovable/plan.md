

# Plan: Redesign Resource Assignments UI for Readability

## Problem Analysis

The current Project Management page displays **all 10 resource category cards** in a responsive grid (1-4 columns). Each card contains **all 8 fields**, resulting in:
- Visual clutter - 10 cards x 8 fields = 80+ UI elements visible at once
- Poor scannability - hard to compare resources across rows
- No hierarchy - all fields shown with equal prominence regardless of selection state

## Complete Field List to Preserve

Each resource assignment MUST include all these fields (per the current `ResourceAssignment` interface):

| # | Field | Type | Current Implementation |
|---|-------|------|------------------------|
| 1 | **Selected** | Checkbox | Select/deselect this resource category |
| 2 | **Status** | Dropdown | Pending / Confirmed / Completed / Cancelled |
| 3 | **Confirmed** | Dropdown | Yes / No |
| 4 | **Collaborator** | Text Input | Task Assigned To - collaborator name |
| 5 | **Due Date** | Date Input | Task due date |
| 6 | **Start Date** | Date Input | Task start date |
| 7 | **End Date** | Date Input | Task end date |
| 8 | **Dependencies** | Multi-Select | Array of task IDs (upgrade to multi-select) |

---

## Solution: Expandable Table Layout

### Design Principles
1. **Expandable** - Resource section collapsed by default, toggle to expand
2. **Selected Only** - Show only selected resources, with "Add Resource" control
3. **Table Format** - Horizontal rows for easy scanning across resources
4. **All Fields Visible** - Each row shows ALL 8 fields without hiding any
5. **Multi-Dependencies** - Upgrade from single to multi-select

---

## Visual Design

### Task Card (Collapsed - Default)
```text
+-------------------------------------------------------+
| [Booking]  Complete Venue Checklist    [Priority: High]|
|-------------------------------------------------------|
| [In Progress v]   Assigned: John Doe   Due: 04/28/26  |
|-------------------------------------------------------|
| [View Request]  [3 Resources]  [v Expand Resources]   |
+-------------------------------------------------------+
```

### Task Card (Expanded)
```text
+---------------------------------------------------------------------------------+
| [Booking]  Complete Venue Checklist                        [Priority: High]    |
|---------------------------------------------------------------------------------|
| [In Progress v]   Assigned: John Doe   Due: 04/28/26                           |
|---------------------------------------------------------------------------------|
| RESOURCE ASSIGNMENTS (3 selected)                        [^ Collapse] [+ Add]  |
|---------------------------------------------------------------------------------|
| Resource   | Collaborator  | Due Date   | Start    | End      | Status    |Conf|Deps|
|---------------------------------------------------------------------------------|
| ☑ Bookings | [Jane Smith ] | [04/28/26] | [03/15] | [03/30] | [Pending v]|[Y]|[2] |
|---------------------------------------------------------------------------------|
| ☑ Venues   | [Bob Wilson ] | [04/03/26] | [02/13] | [02/13] | [Pending v]|[N]|[0] |
|---------------------------------------------------------------------------------|
| ☑ Vendors  | [___________ ] | [__/__/__] | [__/__] | [__/__] | [Pending v]|[N]|[0] |
|---------------------------------------------------------------------------------|
| [+ Add Resource Category v]                                                     |
+---------------------------------------------------------------------------------+
```

### Dependencies Popup (Multi-Select)
When clicking the dependencies cell:
```text
+---------------------------+
| Select Dependencies       |
|---------------------------|
| ☑ Task A: Setup venue     |
| ☐ Task B: Order catering  |
| ☑ Task C: Send invites    |
| ☐ Task D: Confirm guests  |
+---------------------------+
```

---

## Technical Implementation

### File 1: CREATE `src/components/ResourceAssignmentsPanel.tsx`

New component that replaces the grid of ResourceCards:

```typescript
interface ResourceAssignmentsPanelProps {
  taskId: string;
  assignments: Record<string, ResourceAssignment>;
  availableTasks: Array<{ id: string; title: string }>;
  isExpanded: boolean;
  onToggle: () => void;
  onAssignmentChange: (category: string, assignment: ResourceAssignment) => void;
  onCollaboratorSave: (category: string, name: string) => void;
  onDatesSave: (category: string, dates: { due_date?: string; start_date?: string; end_date?: string }) => void;
}
```

Features:
- Collapsible header with resource count badge
- Table layout showing only selected resources
- Each row contains ALL 8 fields inline
- "Add Resource" dropdown to select unselected categories
- Remove button to deselect a resource

### File 2: CREATE `src/components/ResourceAssignmentTableRow.tsx`

Individual table row component:

```typescript
interface ResourceAssignmentTableRowProps {
  category: string;
  assignment: ResourceAssignment;
  availableTasks: Array<{ id: string; title: string }>;
  onUpdate: (assignment: ResourceAssignment) => void;
  onRemove: () => void;
  onCollaboratorSave: (name: string) => void;
  onDatesSave: (dates: {...}) => void;
}
```

Row contains (all visible, no hidden fields):
- Resource name (with remove button)
- Collaborator text input
- Due date input
- Start date input
- End date input
- Status dropdown
- Confirmed dropdown
- Dependencies multi-select button (shows count, opens popover)

### File 3: CREATE `src/components/DependencyMultiSelect.tsx`

Multi-select popover for dependencies:

```typescript
interface DependencyMultiSelectProps {
  selectedDependencies: string[];
  availableTasks: Array<{ id: string; title: string }>;
  onChange: (dependencies: string[]) => void;
  disabled?: boolean;
}
```

Features:
- Button showing selected count "[3 deps]"
- Popover with checkbox list of available tasks
- Select/deselect multiple dependencies
- Updates parent on change

### File 4: MODIFY `src/components/TaskManager.tsx`

Replace the ResourceCard grid sections with ResourceAssignmentsPanel:

**Changes at lines ~1380-1425 (Create Task Dialog):**
```tsx
// Replace grid of 10 ResourceCards with:
<ResourceAssignmentsPanel
  taskId="new-task"
  assignments={resourceAssignments}
  availableTasks={availableTasks}
  isExpanded={isResourcePanelExpanded}
  onToggle={() => setIsResourcePanelExpanded(!isResourcePanelExpanded)}
  onAssignmentChange={(category, newAssignment) => {
    setResourceAssignments(prev => ({ ...prev, [category]: newAssignment }));
  }}
  onCollaboratorSave={(category, name) => {...}}
  onDatesSave={(category, dates) => {...}}
/>
```

**Changes at lines ~1690-1830 (Task List - Expanded View):**
```tsx
// Replace grid of 10 ResourceCards with:
<ResourceAssignmentsPanel
  taskId={task.id}
  assignments={task.resource_assignments || getEmptyResourceAssignments()}
  availableTasks={availableTasks.filter(t => t.id !== task.id)}
  isExpanded={expandedResourceTaskId === task.id}
  onToggle={() => setExpandedResourceTaskId(
    expandedResourceTaskId === task.id ? null : task.id
  )}
  onAssignmentChange={async (category, newAssignment) => {
    // Same logic as current onAssignmentChange
  }}
  onCollaboratorSave={async (category, name) => {
    // Same logic as current onCollaboratorSave
  }}
  onDatesSave={async (category, dates) => {
    // Same logic as current onDatesSave
  }}
/>
```

**Add state for expand/collapse:**
```tsx
const [expandedResourceTaskId, setExpandedResourceTaskId] = useState<string | null>(null);
const [isResourcePanelExpanded, setIsResourcePanelExpanded] = useState(false);
```

### File 5: MODIFY `src/components/ResourceCard.tsx`

Keep for backward compatibility but update dependencies to support multi-select (used in edit dialogs if needed).

---

## Table Column Layout

| Column | Width | Component |
|--------|-------|-----------|
| Resource | 120px | Checkbox + Label + Remove button |
| Collaborator | 150px | Text Input |
| Due Date | 110px | Date Input |
| Start | 100px | Date Input |
| End | 100px | Date Input |
| Status | 110px | Select dropdown |
| Confirmed | 70px | Select (Y/N) |
| Dependencies | 80px | Button with count + popover |

Total: ~840px (scrollable on smaller screens)

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/ResourceAssignmentsPanel.tsx` | CREATE | Expandable panel with table layout |
| `src/components/ResourceAssignmentTableRow.tsx` | CREATE | Table row with ALL 8 fields visible |
| `src/components/DependencyMultiSelect.tsx` | CREATE | Multi-select popover for dependencies |
| `src/components/TaskManager.tsx` | MODIFY | Replace ResourceCard grids with panel |
| `src/components/ResourceCard.tsx` | KEEP/MODIFY | Update for multi-dependency support |
| `src/components/ResourceColumn.tsx` | KEEP | Interface already has dependencies[] |

---

## Complete Field Mapping

Each table row displays ALL fields from ResourceAssignment:

| ResourceAssignment Field | Table Column | Input Type |
|--------------------------|--------------|------------|
| `selected` | Row checkbox | Checkbox (implicit - row exists = selected) |
| `collaborator_name` | Collaborator | Text Input |
| `due_date` | Due Date | Date Input |
| `start_date` | Start | Date Input |
| `end_date` | End | Date Input |
| `status` | Status | Select (4 options) |
| `confirmed` | Conf | Select (Y/N) |
| `dependencies` | Deps | Multi-select popover |

All 8 fields are visible and editable in each row. No fields are hidden or collapsed.

