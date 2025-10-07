# Permission System Documentation

## Overview

The application uses a two-tier permission system:
- **Roles**: Define user types (Manager, Event Planner, Host, etc.)
- **Permission Levels**: Define access control (Admin, Coordinator, Viewer)

This separation allows flexible user type definitions while maintaining consistent access control across the application.

## Permission Levels

### Admin
- **Icon**: Crown 👑
- **Access**: Full system access including user management
- **Can**: Create, read, update, and delete all resources
- **Mapped Roles**: Manager

### Coordinator
- **Icon**: Clipboard 📋
- **Access**: Can manage events and resources
- **Can**: Create, read, and update most resources; limited delete permissions
- **Mapped Roles**: Event Planner, Organizer

### Viewer
- **Icon**: Eye 👁️
- **Access**: Read-only access to events
- **Can**: View events and resources they have access to
- **Mapped Roles**: Host, Venue Owner, Hospitality Provider

## Default Role Mappings

| Role | Permission Level |
|------|------------------|
| Manager | Admin |
| Event Planner | Coordinator |
| Organizer | Coordinator |
| Host | Viewer |
| Venue Owner | Viewer |
| Hospitality Provider | Viewer |

## Usage in Frontend

### Using the usePermissions Hook

```typescript
import { usePermissions } from '@/lib/permissions';

function MyComponent() {
  const { isAdmin, isCoordinator, hasMinPermission, permissionLevel } = usePermissions();
  
  // Check specific permission level
  if (isAdmin()) {
    // Show admin-only features
  }
  
  // Check minimum permission level (coordinator or admin)
  if (hasMinPermission('coordinator')) {
    // Show coordinator features
  }
  
  // Get the actual permission level
  console.log(permissionLevel); // 'admin' | 'coordinator' | 'viewer' | null
}
```

### Available Functions

- `isAdmin()`: Returns true if user has admin permission
- `isCoordinator()`: Returns true if user has coordinator permission
- `isViewer()`: Returns true if user has viewer permission
- `hasPermission(level)`: Returns true if user has exact permission level
- `hasMinPermission(level)`: Returns true if user has at least this permission level
- `permissionLevel`: The user's current permission level
- `loading`: Boolean indicating if permissions are still loading

## Usage in Database (RLS Policies)

### Check Exact Permission Level

```sql
-- Only admins can delete events
CREATE POLICY "Admins can delete events"
ON "Create Event"
FOR DELETE
TO authenticated
USING (has_permission_level(auth.uid(), 'admin'));
```

### Check Minimum Permission Level

```sql
-- Coordinators and admins can update events
CREATE POLICY "Coordinators can update events"
ON "Create Event"
FOR UPDATE
TO authenticated
USING (has_min_permission_level(auth.uid(), 'coordinator'))
WITH CHECK (has_min_permission_level(auth.uid(), 'coordinator'));
```

## Modifying Permission Mappings

To change which roles map to which permission levels:

1. **Via SQL**:
```sql
UPDATE role_permission_groups 
SET permission_group = 'coordinator' 
WHERE role = 'host';
```

2. **Via Supabase Dashboard**:
   - Navigate to Table Editor → role_permission_groups
   - Edit the permission_group for any role

## Adding New Roles

When adding a new role to the system:

1. Add the role to the `app_role` enum:
```sql
ALTER TYPE app_role ADD VALUE 'new_role_name';
```

2. Add the permission mapping:
```sql
INSERT INTO role_permission_groups (role, permission_group)
VALUES ('new_role_name', 'viewer'); -- or 'coordinator' or 'admin'
```

3. Update frontend role lists in `RoleManager.tsx`

## Security Notes

⚠️ **IMPORTANT**: 
- Roles are stored in the `user_roles` table (never on profiles or users table)
- Permission checks use SECURITY DEFINER functions to prevent RLS recursion
- Always use server-side validation (RLS policies) for security
- Frontend permission checks are for UX only, not security

## Troubleshooting

### Permission not updating after role change
- The frontend caches permission mappings
- Refresh the page to reload permission data
- Check that the role exists in `role_permission_groups` table

### User can't access expected features
1. Verify user has a role assigned in `user_roles` table
2. Check the role's permission mapping in `role_permission_groups`
3. Verify RLS policies are correctly using permission functions
4. Check browser console for permission-related errors

## Database Functions

### `has_permission_level(_user_id, _level)`
Returns true if user has the exact permission level specified.

### `has_min_permission_level(_user_id, _level)`
Returns true if user has at least the permission level specified.
Hierarchy: admin > coordinator > viewer

Both functions:
- Are SECURITY DEFINER to bypass RLS
- Are STABLE for query optimization
- Set search_path for security
- Join user_roles with role_permission_groups
