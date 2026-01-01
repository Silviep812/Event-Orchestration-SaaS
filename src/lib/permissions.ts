import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type PermissionLevel = 'admin' | 'coordinator' | 'viewer';

interface RolePermissionMapping {
  role: string;
  permission_group: PermissionLevel;
}

interface PermissionsResult {
  permissionLevel: PermissionLevel | null;
  hasPermission: (level: PermissionLevel) => boolean;
  hasMinPermission: (level: PermissionLevel) => boolean;
  isAdmin: () => boolean;
  isCoordinator: () => boolean;
  isViewer: () => boolean;
  loading: boolean;
}

// Cache permission mappings to avoid repeated queries
let cachedMappings: Map<string, PermissionLevel> | null = null;

async function fetchPermissionMappings(): Promise<Map<string, PermissionLevel>> {
  if (cachedMappings) {
    return cachedMappings;
  }

  const { data, error } = await supabase
    .from('role_permission_groups')
    .select('role, permission_group');

  if (error) {
    console.error('Error fetching permission mappings:', error);
    return new Map();
  }

  cachedMappings = new Map(
    (data as RolePermissionMapping[]).map(mapping => [
      mapping.role,
      mapping.permission_group
    ])
  );

  return cachedMappings;
}

export function usePermissions(): PermissionsResult {
  const { userRoles, loading: authLoading } = useAuth();
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissionLevel() {
      if (authLoading) {
        return;
      }

      if (!userRoles || userRoles.length === 0) {
        setPermissionLevel(null);
        setLoading(false);
        return;
      }

      try {
        // Query user_roles table to get permission_level directly
        const userResult = await supabase.auth.getUser();
        const userId = userResult.data.user?.id;
        const { data, error } = await supabase
          .from('user_roles')
          .select('permission_level')
          .eq('user_id', userId);

        if (error) {
          throw error;
        }

        // Find highest permission level from user's roles
        let highestLevel: PermissionLevel | null = null;
        const levelPriority = { admin: 3, coordinator: 2, viewer: 1 };

        for (const roleData of data || []) {
          const level = roleData.permission_level as PermissionLevel;
          if (level) {
            if (!highestLevel || levelPriority[level] > levelPriority[highestLevel]) {
              highestLevel = level;
            }
          }
        }

        setPermissionLevel(highestLevel);
      } catch (error) {
        console.error('Error loading permission level:', error);
        setPermissionLevel(null);
      } finally {
        setLoading(false);
      }
    }

    loadPermissionLevel();
  }, [userRoles, authLoading]);

  const hasPermission = (level: PermissionLevel): boolean => {
    return permissionLevel === level;
  };

  const hasMinPermission = (level: PermissionLevel): boolean => {
    if (!permissionLevel) return false;
    
    const levelPriority = { admin: 3, coordinator: 2, viewer: 1 };
    return levelPriority[permissionLevel] >= levelPriority[level];
  };

  const isAdmin = (): boolean => permissionLevel === 'admin';
  const isCoordinator = (): boolean => permissionLevel === 'coordinator';
  const isViewer = (): boolean => permissionLevel === 'viewer';

  return {
    permissionLevel,
    hasPermission,
    hasMinPermission,
    isAdmin,
    isCoordinator,
    isViewer,
    loading: loading || authLoading,
  };
}
