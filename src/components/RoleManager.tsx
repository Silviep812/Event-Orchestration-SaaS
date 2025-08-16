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
  userid?: string;
  user_name?: string;
  email?: string;
  contact_name?: string;
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
    { value: 'admin', label: 'Admin', description: 'Full system access' },
    { value: 'event_manager', label: 'Event Manager', description: 'Manage events and overall coordination' },
    { value: 'vendor_coordinator', label: 'Vendor Coordinator', description: 'Manage vendor relationships' },
    { value: 'budget_manager', label: 'Budget Manager', description: 'Handle financial planning and tracking' },
    { value: 'task_coordinator', label: 'Task Coordinator', description: 'Assign and track task completion' },
    { value: 'client', label: 'Client', description: 'View event progress and provide feedback' }
  ];

  const roleColors = {
    admin: "bg-red-100 text-red-800",
    event_manager: "bg-blue-100 text-blue-800",
    vendor_coordinator: "bg-green-100 text-green-800",
    budget_manager: "bg-yellow-100 text-yellow-800",
    task_coordinator: "bg-purple-100 text-purple-800",
    client: "bg-gray-100 text-gray-800"
  };

  useEffect(() => {
    fetchUserRoles();
    fetchUsers();
  }, []);

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      toast({
        title: "Error fetching roles",
        description: "Failed to load user roles. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_directory_safe');

      if (error) throw error;
      setUsers(data || []);
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
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser,
          role: selectedRole as any
        });

      if (error) throw error;

      toast({
        title: "Role assigned",
        description: "User role has been assigned successfully.",
      });

      setSelectedUser("");
      setSelectedRole("");
      setIsAssignDialogOpen(false);
      fetchUserRoles();
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: "Role already assigned",
          description: "This user already has this role assigned.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error assigning role",
          description: "Failed to assign role. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const removeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "Role removed",
        description: "User role has been removed successfully.",
      });

      fetchUserRoles();
    } catch (error) {
      toast({
        title: "Error removing role",
        description: "Failed to remove role. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInfo = (userId: string) => {
    return users.find(user => user.userid === userId);
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
                    {users.map((user) => (
                      <SelectItem key={user.userid} value={user.userid || ''}>
                        {user.user_name || user.contact_name || user.email}
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
                        {user?.user_name || user?.contact_name || user?.email || 'Unknown User'}
                      </h4>
                      {user?.email && (
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                    <Badge className={roleColors[userRole.role as keyof typeof roleColors]}>
                      {roleInfo?.label || userRole.role}
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeRole(userRole.id)}
                  >
                    Remove
                  </Button>
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