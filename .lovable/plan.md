

# Change "Assign Collaborator Task To" from Dropdown to Manual Entry

## Overview

Replace the dropdown/combobox fields for assigning collaborators with simple text input fields that allow free-form manual entry of names.

## Changes Required

### File: `src/components/TaskManager.tsx`

Three locations need to be modified:

| Location | Lines | Current Implementation | New Implementation |
|----------|-------|----------------------|-------------------|
| Create Task Dialog | 1350-1458 | Popover with Command combobox | Simple Input field |
| Task Card View | 1654-1703 | Select dropdown | Simple Input field with save button |
| Edit Task Dialog | 1816-1920 | Popover with Command combobox | Simple Input field |

### Detailed Changes

**1. Create Task Dialog (lines 1350-1458)**

Replace the entire Popover/Command block with:
- A simple `Input` text field
- Keep the "X" button to clear the value
- Update helper text from "Type to search for a collaborator" to "Enter collaborator name"

**2. Task Card View (lines 1654-1703)**

Replace the Select dropdown with:
- An `Input` field for typing the name
- A small save button to commit changes
- The input will update the database when the user finishes typing and clicks save

**3. Edit Task Dialog (lines 1816-1920)**

Replace the Popover/Command block with:
- A simple `Input` text field matching the create dialog pattern
- Keep the ability to clear the field

### State Cleanup

Remove unused state variables (lines 140-143):
- `coordinatorSearchOpen`
- `coordinatorSearchTerm`
- `editCoordinatorSearchOpen`
- `editCoordinatorSearchTerm`

These states were only needed for the dropdown search functionality.

### Import Cleanup

The following imports can be removed from the component since they will no longer be used for this feature:
- `ChevronsUpDown`, `Check` from lucide-react (if not used elsewhere)
- `Command`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList` (if not used elsewhere)

## Technical Details

### Benefits of Manual Entry
- Simpler user experience - just type a name directly
- Allows assigning tasks to people not in the system
- Faster data entry without waiting for dropdown to load

### Validation
The existing validation in `taskValidation.ts` already supports optional `assigned_coordinator_name` as a string with max 100 characters - no changes needed there.

