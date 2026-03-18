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

const levelPriority: Record<PermissionLevel, number> = {
  admin: 3,
  coordinator: 2,
  viewer: 1,
};

let cachedMappings: Map<string, PermissionLevel> | null = null;
let cachedPermissionByUser = new Map<string, PermissionLevel | null>();
let inFlightPermissionRequests = new Map<string, Promise<PermissionLevel | null>>();

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
    (data as RolePermissionMapping[]).map((mapping) => [mapping.role, mapping.permission_group])
  );

  return cachedMappings;
}

async function fetchHighestPermission(userId: string): Promise<PermissionLevel | null> {
  if (cachedPermissionByUser.has(userId)) {
    return cachedPermissionByUser.get(userId) ?? null;
  }

  const existingRequest = inFlightPermissionRequests.get(userId);
  if (existingRequest) {
    return existingRequest;
  }

  const request = supabase
    .from('user_roles')
    .select('permission_level')
    .eq('user_id', userId)
    .then(({ data, error }) => {
      if (error) {
        throw error;
      }

      let highestLevel: PermissionLevel | null = null;

      for (const roleData of data || []) {
        const level = roleData.permission_level as PermissionLevel | null;
        if (level && (!highestLevel || levelPriority[level] > levelPriority[highestLevel])) {
          highestLevel = level;
        }
      }

      cachedPermissionByUser.set(userId, highestLevel);
      return highestLevel;
    })
    .finally(() => {
      inFlightPermissionRequests.delete(userId);
    });

  inFlightPermissionRequests.set(userId, request);
  return request;
}

export function usePermissions(): PermissionsResult {
  const { user, userRoles, loading: authLoading } = useAuth();
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissionLevel() {
      if (authLoading) {
        return;
      }

      if (!user?.id || !userRoles || userRoles.length === 0) {
        setPermissionLevel(null);
        setLoading(false);
        return;
      }

      try {
        const highestLevel = await fetchHighestPermission(user.id);
        setPermissionLevel(highestLevel);
      } catch (error) {
        console.error('Error loading permission level:', error);
        setPermissionLevel(null);
      } finally {
        setLoading(false);
      }
    }

    loadPermissionLevel();
  }, [user?.id, userRoles, authLoading]);

  const hasPermission = (level: PermissionLevel): boolean => permissionLevel === level;

  const hasMinPermission = (level: PermissionLevel): boolean => {
    if (!permissionLevel) return false;
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
