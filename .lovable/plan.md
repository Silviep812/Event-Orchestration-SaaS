

# Add Status Dropdown and Confirmation to Resource Category Assignments

## Overview

Transform the Task Assignments section from simple checkboxes to an enhanced resource tracking system where each resource category includes a status dropdown and confirmation checkbox, matching the Bookings page pattern.

## Complete Resource Categories List

The following resource categories will be available (keeping Bookings and adding Vendors and Marketing):

| # | Resource Category |
|---|------------------|
| 1 | Bookings |
| 2 | Vendors |
| 3 | Venues |
| 4 | Hospitality |
| 5 | Vendor Service Rental/Buy |
| 6 | Service Vendor |
| 7 | Transportation |
| 8 | Entertainment |
| 9 | Suppliers |
| 10 | Marketing |

## Changes Required

### File: `src/components/TaskManager.tsx`

#### 1. Update State Structure

Replace the simple string array with a structured object to track status and confirmation:

```text
Current: selectedCollaboratorTypes: string[]

New: resourceAssignments: Record<string, {
  selected: boolean;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  confirmed: boolean;
}>
```

#### 2. New UI Layout for Task Assignments

Replace the current checkbox list with an enhanced layout:

```text
┌────────────────────────────────────────────────────────────────┐
│ Task Assignments                                                │
├────────────────────────────────────────────────────────────────┤
│ ☑ Bookings       │ Status: [Pending ▼]    │ ☑ Confirmed       │
│ ☐ Vendors        │ Status: [Pending ▼]    │ ☐ Confirmed       │
│ ☐ Venues         │ Status: [Pending ▼]    │ ☐ Confirmed       │
│ ☐ Hospitality    │ Status: [Pending ▼]    │ ☐ Confirmed       │
│ ... (remaining categories)                                      │
└────────────────────────────────────────────────────────────────┘
```

Each row contains:
- Checkbox to select the resource category
- Status dropdown (Pending, Confirmed, Completed, Cancelled) - enabled when selected
- Confirmation checkbox - enabled when selected

#### 3. Status Options

| Status | Color Badge |
|--------|-------------|
| Pending | Yellow |
| Confirmed | Blue |
| Completed | Green |
| Cancelled | Red |

#### 4. Task Card Display

Show assigned resources with status badges:

```text
Bookings: Confirmed ✓ | Venues: Pending | Transportation: Completed ✓
```

#### 5. Locations to Update

| Location | Lines (approx) | Change |
|----------|----------------|--------|
| Create Task Dialog | 1294-1337 | Replace checkbox list with enhanced resource rows |
| Task Card Display | 1546-1680 | Show resource assignments with status badges |
| Edit Task Dialog | 1687-1920 | Mirror the enhanced resource assignment UI |

### Sidebar Addition

**File: `src/components/AppSidebar.tsx`**
- Add "Marketing" to the Resources section

**File: `src/pages/Marketing.tsx`** (New file)
- Create placeholder Marketing page

**File: `src/App.tsx`**
- Add route for `/dashboard/marketing`

### Database Consideration

Add a `resource_assignments` JSONB column to the tasks table to persist the structured data:

```json
{
  "Bookings": { "status": "confirmed", "confirmed": true },
  "Venues": { "status": "pending", "confirmed": false }
}
```

## Files Modified

1. `src/components/TaskManager.tsx` - Main changes to Task Assignments UI
2. `src/components/AppSidebar.tsx` - Add Marketing menu item
3. `src/pages/Marketing.tsx` - New placeholder page
4. `src/App.tsx` - Add Marketing route

