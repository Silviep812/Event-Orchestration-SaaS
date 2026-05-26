import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, UserCheck, Crown, ClipboardList, Eye } from "lucide-react";
import { PermissionLevel, usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { InviteTesterDialog } from "@/components/InviteTesterDialog";


interface UserRole {
  id: string;
  user_id: string;
  role: string;
  permission_level: PermissionLevel | null;
  event_id: string | null;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  avatar?: string;
}

interface Event {
  id: string;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  archived?: boolean | null;
  created_at: string;
  organizer_name?: string;
}

export function RoleManager({
  selectedEventFilter = "all",
  showAddTaskShortcut = true,
  suppressPrimaryHeading = false,
}: {
  selectedEventFilter?: string;
  /** When false, hides the PM → Add Task card (e.g. Collaborator tab has its own entry points). */
  showAddTaskShortcut?: boolean;
  /** When true, omits the top "Role Management" heading (parent page already provides context). */
  suppressPrimaryHeading?: boolean;
}) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionMappings, setPermissionMappings] = useState<Map<string, PermissionLevel>>(new Map());
  const [dataTimestamp, setDataTimestamp] = useState(Date.now());
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();


  const roles = [
    { value: 'manager', label: 'Manager', description: 'Full access to manage events, users, and system settings' },
    { value: 'host', label: 'Host', description: 'Host and manage events' },
    { value: 'organizer', label: 'Organizer', description: 'Organize and coordinate event details' },
    { value: 'event_planner', label: 'Event Planner', description: 'Plan and execute event logistics' },
    { value: 'venue_owner', label: 'Venue Owner', description: 'Manage venue-related information' },
    { value: 'hospitality_provider', label: 'Hospitality Provider', description: 'Provide hospitality services' }
  ];

  const permissionLevels = {
    admin: {
      label: "Admin",
      icon: Crown,
      color: "bg-destructive/10 text-destructive",
      description:
        "Create, read, update, and delete data and files. Full access including user management.",
    },
    coordinator: {
      label: "Coordinator",
      icon: ClipboardList,
      color: "bg-primary/10 text-primary",
      description:
        "Create, read, and update data and files. Manage events, tasks, budgets, and approve change requests.",
    },
    viewer: {
      label: "Viewer",
      icon: Eye,
      color: "bg-muted-foreground/10 text-muted-foreground",
      description: "Read-only access to events and files.",
    },
  };

  const roleColors = {
    manager: "bg-destructive/10 text-destructive",
    host: "bg-primary/10 text-primary",
    organizer: "bg-accent/50 text-accent-foreground",
    event_planner: "bg-secondary/50 text-secondary-foreground",
    venue_owner: "bg-muted text-muted-foreground",
    hospitality_provider: "bg-primary/20 text-primary"
  };

  useEffect(() => {
    let isMounted = true;
    console.log('[RoleManager] Component mounted, fetching data...');
    
    const fetchData = async () => {
      if (!isMounted) return;
      await fetchPermissionMappings();
      if (!isMounted) return;
      await fetchUsers();
      if (!isMounted) return;
      await fetchEvents();
    };
    
    fetchData();

    // Set up real-time subscriptions for automatic updates
    const eventsChannel = supabase
      .channel('role-manager-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('[RoleManager] Events changed:', payload);
          if (isMounted) {
            fetchEvents();
          }
        }
      )
      .subscribe();

    const rolesChannel = supabase
      .channel('role-manager-user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        (payload) => {
          console.log('[RoleManager] User roles changed:', payload);
          if (isMounted) {
            fetchUsers();
          }
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('role-manager-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('[RoleManager] Profiles changed:', payload);
          if (isMounted) {
            fetchUsers();
          }
        }
      )
      .subscribe();
    
    return () => {
      isMounted = false;
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, start_date, end_date, status, archived, created_at, user_id')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch profiles for organizer names only if we have events
      if (eventsData && eventsData.length > 0) {
        const userIds = eventsData.map(e => e.user_id).filter(Boolean);
        
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('user_profiles_teammate_view')
            .select('user_id, display_name')
            .in('user_id', userIds);

          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
          }

          // Create a map of user_id to display_name
          const profilesMap = new Map(
            profilesData?.map(p => [p.user_id, p.display_name]) || []
          );

          // Combine events with organizer names
          const eventsWithOrganizer = eventsData.map(event => ({
            id: event.id,
            title: event.title,
            start_date: event.start_date,
            end_date: event.end_date,
            status: event.status,
            archived: event.archived,
            created_at: event.created_at,
            organizer_name: profilesMap.get(event.user_id) || 'Unknown'
          }));

          console.log('[RoleManager] Events loaded:', eventsWithOrganizer.length);
          setEvents(eventsWithOrganizer);
          return;
        }
      }
      
      // If no events or no user IDs, just set empty
      setEvents([]);
      console.log('[RoleManager] No events found');
    } catch (error) {
      console.error('[RoleManager] Error fetching events:', error);
      setEvents([]);
    }
  };

  const fetchPermissionMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permission_groups')
        .select('role, permission_group');

      if (error) throw error;

      const mappings = new Map(
        data.map((item: any) => [item.role, item.permission_group as PermissionLevel])
      );
      setPermissionMappings(mappings);
    } catch (error) {
      console.error('Error fetching permission mappings:', error);
    }
  };

  const fetchUserRoles = async () => {
    // No longer needed as roles are now managed via auth metadata
    setUserRoles([]);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all role assignments from user_roles table
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, permission_level, event_id, created_at');

      if (rolesError) throw rolesError;

      // Call edge function to get users with emails (admin access required)
      const { data: usersResponse, error: usersError } = await supabase.functions.invoke('get-users-for-roles');
      
      if (usersError) {
        console.error('Error fetching users from edge function:', usersError);
        throw usersError;
      }
      
      const allUsers = usersResponse?.users?.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: 'online' as const,
        joinedAt: user.created_at || new Date().toISOString(),
        avatar: user.avatar
      })) || [];
      
      // Create users list with role information
      const usersWithRoles = allUsers.map((user: any) => {
        const userRole = userRolesData?.find(role => role.user_id === user.id);
        return {
          ...user,
          role: userRole?.role || 'Member'
        };
      });

      setUsers(usersWithRoles);

      // Set all role assignments for display (including those not in invited users)
      const roleAssignments = userRolesData?.map((role: any) => ({
        id: role.id, // Use the actual row ID, not user_id
        user_id: role.user_id,
        role: role.role,
        permission_level: role.permission_level,
        event_id: role.event_id,
        created_at: role.created_at
      })) || [];
      
      setUserRoles(roleAssignments);
      console.log('[RoleManager] Users loaded:', allUsers.length, 'Role assignments:', roleAssignments.length);
      
      // Update timestamp to force Select component re-renders
      setDataTimestamp(Date.now());
      
      // If no roles exist and current user exists, offer to set up admin
      if (roleAssignments.length === 0 && allUsers.length > 0) {
        console.log('[RoleManager] No roles exist yet. Consider assigning initial admin role.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error fetching users",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (
    roleAssignmentId: string,
    userId: string, 
    newRole: 'host' | 'organizer' | 'event_planner' | 'venue_owner' | 'hospitality_provider' | 'manager',
    permissionLevel: PermissionLevel,
    eventId: string | null = null
  ) => {
    try {
      console.log('Updating role assignment:', { roleAssignmentId, userId, newRole, permissionLevel, eventId });
      
      // Update the specific role assignment by ID
      const { data, error } = await supabase
        .from('user_roles')
        .update({ 
          role: newRole,
          permission_level: permissionLevel,
          event_id: eventId
        })
        .eq('id', roleAssignmentId)
        .select();

      console.log('Role update result:', { data, error });

      if (error) throw error;

      // Refresh the data
      await fetchUsers();
      
      toast({
        title: "Role updated",
        description: "User role and permission level have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error updating role",
        description: error?.message || "Failed to update role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInfo = (userId: string) => {
    const user = users.find(user => user.id === userId);
    if (user) return user;
    
    // For users not in the invited list, return basic info
    return {
      id: userId,
      name: `User ${userId.slice(0, 8)}...`,
      email: 'Unknown',
      status: 'active'
    };
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      {!suppressPrimaryHeading ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-2xl font-bold">Role Management</h2>
          {isAdmin() && <InviteTesterDialog />}
        </div>
      ) : (
        isAdmin() && (
          <div className="flex justify-end">
            <InviteTesterDialog />
          </div>
        )
      )}


      {/* Permission Level Legend */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Permission Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(permissionLevels).map(([key, level]) => {
              const Icon = level.icon;
              return (
                <div key={key} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${level.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{level.label}</p>
                    <p className="text-xs text-muted-foreground">{level.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Guidelines: permission groups</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Published guidelines describe <strong className="text-foreground">Organizers</strong> (CRU),{" "}
            <strong className="text-foreground">Administrators</strong> (CRUD), <strong className="text-foreground">Partners</strong>{" "}
            (CRU), <strong className="text-foreground">Collaborators</strong> (Read and Update), and{" "}
            <strong className="text-foreground">Viewers</strong> (Read only). This app stores{" "}
            <strong className="text-foreground">Admin</strong>, <strong className="text-foreground">Coordinator</strong>, and{" "}
            <strong className="text-foreground">Viewer</strong> on each assignment—use them to implement those access patterns.
          </p>
        </CardContent>
      </Card>

      {/* Role Assignments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current Role Assignments</h3>
        
        {userRoles.map((userRole) => {
          const user = getUserInfo(userRole.user_id);
          const roleInfo = roles.find(r => r.value === userRole.role);
          // Use the actual database value, with 'viewer' as fallback only if null
          const currentPermission = userRole.permission_level ?? 'viewer';
          const permissionInfo = permissionLevels[currentPermission];
          const PermissionIcon = permissionInfo?.icon;
          const assignedEvent = events.find(e => e.id === userRole.event_id);
          
          return (
            <Card key={userRole.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-semibold">
                          {user?.name || 'Unknown User'}
                        </h4>
                        {user?.email && (
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        )}
                        {userRole.event_id && assignedEvent && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Event: {assignedEvent.title || 'Unnamed Event'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={roleColors[userRole.role as keyof typeof roleColors]}>
                          {roleInfo?.label || userRole.role}
                        </Badge>
                        {permissionInfo && PermissionIcon && (
                          <Badge variant="outline" className={permissionInfo.color}>
                            <PermissionIcon className="h-3 w-3 mr-1" />
                            {permissionInfo.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Event Organizer</label>
                      <p className="text-sm font-medium">
                        {assignedEvent?.organizer_name || 'Not specified'}
                      </p>
                    </div>
                    
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                      <Select
                        key={`${userRole.id}-role-${dataTimestamp}-${userRole.role}`}
                        value={userRole.role}
                        onValueChange={(newRole) => {
                          console.log('[RoleManager] Role changed to:', newRole, 'for user:', userRole.user_id);
                          // Only change role, keep current permission
                          changeRole(userRole.id, userRole.user_id, newRole as any, currentPermission, userRole.event_id);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select role..." />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Permission Level
                        {permissionMappings.get(userRole.role) && currentPermission === permissionMappings.get(userRole.role) && (
                          <span className="text-xs text-muted-foreground ml-1">(suggested)</span>
                        )}
                      </label>
                      <Select
                        key={`${userRole.id}-permission-${dataTimestamp}-${currentPermission}`}
                        value={currentPermission}
                        onValueChange={(newPermission) => changeRole(userRole.id, userRole.user_id, userRole.role as any, newPermission as PermissionLevel, userRole.event_id)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select permission..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(permissionLevels).map(([key, level]) => (
                            <SelectItem key={key} value={key}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {roleInfo?.description && (
                    <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {userRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No role assignments yet</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            When users are invited and granted roles for this workspace, they appear here with permission
            levels. Coordinators manage assignments per your business guidelines.
          </p>
        </div>
      )}

      {showAddTaskShortcut ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Add task assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Same form as Project Management &gt; Task &gt; Add Task. Select an event in the filter at
              the top of this page first.
            </p>
            <Button
              type="button"
              disabled={selectedEventFilter === "all"}
              onClick={() =>
                navigate(
                  `/dashboard/project-management?eventId=${selectedEventFilter}&openModal=true`
                )
              }
            >
              Add task assignment
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}