import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Users, UserCheck } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
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

export function RoleManager() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const { toast } = useToast();

  const roles = [
    { value: 'host', label: 'Host', description: 'Primary event host responsible for overall event success' },
    { value: 'organizer', label: 'Organizer', description: 'Coordinate event logistics and team activities' },
    { value: 'event_planner', label: 'Event Planner', description: 'Professional event planning and design' },
    { value: 'venue_owner', label: 'Venue Owner', description: 'Manage venue-specific requirements and services' },
    { value: 'hospitality_provider', label: 'Hospitality Provider', description: 'Handle guest services and hospitality arrangements' }
  ];

  const roleColors = {
    host: "bg-red-100 text-red-800",
    organizer: "bg-blue-100 text-blue-800",
    event_planner: "bg-green-100 text-green-800",
    venue_owner: "bg-yellow-100 text-yellow-800",
    hospitality_provider: "bg-purple-100 text-purple-800"
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUserRoles = async () => {
    // No longer needed as roles are now managed via auth metadata
    setUserRoles([]);
  };

  const fetchUsers = async () => {
    try {
      // Get users from get-invited-users function
      const { data, error } = await supabase.functions.invoke('get-invited-users');

      if (error) throw error;
      
      // Get all users from the function
      const allUsers = data?.teamMembers || [];
      
      // Get roles from user_roles table
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesError) throw rolesError;

      // Create a map of user roles for quick lookup
      const rolesMap = new Map();
      userRolesData?.forEach(role => {
        rolesMap.set(role.user_id, role);
      });

      // Add role information to users
      const usersWithRoles = allUsers.map((user: any) => ({
        ...user,
        role: rolesMap.get(user.id)?.role || 'Member'
      }));

      setUsers(usersWithRoles);
      
      // Convert roles to role assignments for display
      const roleAssignments = userRolesData?.map((role: any) => ({
        id: role.user_id, // Use user_id as id for consistency
        user_id: role.user_id,
        role: role.role,
        created_at: role.created_at
      })) || [];
      
      setUserRoles(roleAssignments);
    } catch (error) {
      toast({
        title: "Error fetching users",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      // Insert or update role in user_roles table
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: selectedUser,
          role: selectedRole as any
        }, {
          onConflict: 'user_id,role'
        });

      if (error) throw error;

      toast({
        title: "Role assigned",
        description: "User role has been assigned successfully.",
      });

      setSelectedUser("");
      setSelectedRole("");
      setIsAssignDialogOpen(false);
      fetchUsers(); // Refresh the data
    } catch (error: any) {
      toast({
        title: "Error assigning role",
        description: "Failed to assign role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      // Update role in user_roles table
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole as any
        }, {
          onConflict: 'user_id,role'
        });

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });

      fetchUsers(); // Refresh the data
    } catch (error) {
      toast({
        title: "Error updating role",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInfo = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Role Management</h2>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign User Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user">Select User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(user => user.status !== 'invited').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Select Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={assignRole} className="w-full" disabled={!selectedUser || !selectedRole}>
                Assign Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Roles</p>
                <p className="text-2xl font-bold">{userRoles.length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Roles</p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Assignments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current Role Assignments</h3>
        
        {userRoles.map((userRole) => {
          const user = getUserInfo(userRole.user_id);
          const roleInfo = roles.find(r => r.value === userRole.role);
          
          return (
            <Card key={userRole.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-semibold">
                        {user?.name || 'Unknown User'}
                      </h4>
                      {user?.email && (
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                    <Badge className={roleColors[userRole.role as keyof typeof roleColors]}>
                      {roleInfo?.label || userRole.role}
                    </Badge>
                  </div>
                  <Select 
                    value={userRole.role} 
                    onValueChange={(newRole) => changeRole(userRole.user_id, newRole)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
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
                {roleInfo?.description && (
                  <p className="text-sm text-muted-foreground mt-2">{roleInfo.description}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {userRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No roles assigned yet</h3>
          <p className="text-muted-foreground mb-4">Start by assigning roles to team members.</p>
        </div>
      )}

      {/* Role Descriptions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Roles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <Card key={role.value} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={roleColors[role.value as keyof typeof roleColors]}>
                  {role.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{role.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}