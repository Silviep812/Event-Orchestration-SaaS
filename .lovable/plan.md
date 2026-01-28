
# Updated Plan: Add Inline-Editable Resource Assignments to Task Cards

## Current State

The implementation already has:

1. **Resource Category Assignments section** in Create/Edit dialogs - working correctly with checkbox + status dropdown + confirmation for all 10 categories
2. **Manual Collaborator name entry** - present in all three locations (Task Cards, Create Dialog, Edit Dialog) - **will be kept**
3. **Resource badges on Task Cards** - currently showing as read-only badges

## What Needs to Change

The Task Cards currently show resource assignments as **read-only badges**. The user wants them to be **inline-editable** directly on the cards, matching the Booking-style pattern (checkbox + status dropdown + confirmation).

## Locations and Changes

### 1. Task Card Display (Lines 1621-1634)

**Current behavior**: Shows read-only `ResourceAssignmentBadge` components

**New behavior**: Replace with editable `ResourceAssignmentRow` components that allow:
- Toggle selection on/off
- Change status via dropdown
- Toggle confirmation checkbox
- Auto-save changes to database on each change

```text
Current Task Card:
┌──────────────────────────────────────────┐
│ Task Title                               │
│ Status dropdown                          │
│ [Bookings: Pending] [Venues: Confirmed]  │  <-- Read-only badges
│ ─────────────────────────────────        │
│ Assign Collaborator Task To              │
│ [Enter name____________] [Save]          │
│ Hours | Due Date | Dependencies          │
└──────────────────────────────────────────┘

New Task Card:
┌──────────────────────────────────────────┐
│ Task Title                               │
│ Status dropdown                          │
│                                          │
│ Resource Category Assignments            │
│ ☑ Bookings    [Pending ▼]   ☑ Confirmed  │  <-- Editable rows
│ ☑ Venues      [Confirmed ▼] ☐ Confirmed  │
│ ☐ Hospitality [Pending ▼]   ☐ Confirmed  │
│ ... (all 10 categories)                  │
│ ─────────────────────────────────        │
│ Assign Collaborator Task To              │
│ [Enter name____________] [Save]          │
│ Hours | Due Date | Dependencies          │
└──────────────────────────────────────────┘
```

### 2. Auto-Save Logic for Card Resource Changes

Add a function to save resource assignment changes directly from the Task Card:

```text
When user changes any resource assignment on a card:
1. Update local task state immediately (optimistic update)
2. Save to database via Supabase
3. Show success/error toast
```

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/components/TaskManager.tsx` | Replace read-only badges with editable ResourceAssignmentRow components on Task Cards |
| `src/components/TaskManager.tsx` | Add inline save function for resource assignment changes on cards |

### Resource Categories (All 10)

The existing `RESOURCE_CATEGORIES` constant already includes:
1. Bookings
2. Vendors
3. Venues
4. Hospitality
5. Vendor Service Rental/Buy
6. Service Vendor
7. Transportation
8. Entertainment
9. Suppliers
10. Marketing

### What Stays the Same

- "Assign Collaborator Task To" section with manual name entry - **kept in all locations**
- Resource Category Assignments in Create Dialog - **already working**
- Resource Category Assignments in Edit Dialog - **already working**
- Toast messages - remain as-is
- Database schema - no changes needed (`resource_assignments` JSONB column already exists)

## Implementation Steps

1. Add a local state or handler function to manage resource assignment changes on individual Task Cards
2. Replace the read-only `ResourceAssignmentBadge` section with a collapsible/expandable section containing `ResourceAssignmentRow` components for all 10 categories
3. Add auto-save logic that updates the database when any resource assignment is changed on a card
4. Ensure changes persist and the task list refreshes appropriately
