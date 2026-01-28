

# Change "Roles" to "Collaborators" in Project Management

## Overview

Update the Project Management page to use "Collaborators" instead of "Roles" for better clarity about the feature's purpose.

## Changes Required

### File: `src/pages/ProjectManagement.tsx`

| Location | Current Text | New Text |
|----------|--------------|----------|
| Line 63 (description) | "Manage tasks, track budgets, and assign roles for your events" | "Manage tasks, track budgets, and assign collaborators for your events" |
| Line 109 (tab label) | "Roles" | "Collaborators" |

## Technical Details

Two simple text replacements in `src/pages/ProjectManagement.tsx`:

1. **Line 63**: Update the page subtitle
2. **Line 109**: Update the tab trigger text

No other files need to be modified - the underlying `RoleManager` component will continue to function the same way, just with a renamed tab.

