import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, PermissionLevel } from "@/lib/permissions";
import {
  Shield, Users, Crown, ClipboardList, Eye, CheckCircle2, XCircle,
  FileText, ChevronDown, Bell, UserPlus
} from "lucide-react";
import { UnassignedUserCard } from "./UnassignedUserCard";
import { TeamMemberTaskAssignments } from "./TeamMemberTaskAssignments";
import { useNavigate } from "react-router-dom";

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
  start_date: string;
  created_at: string;
  organizer_name?: string;
  user_id?: string;
}

interface ChangeRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  description: string | null;
  created_at: string;
  event_id: string | null;
  requested_by: string | null;
  field_changes: any;
}

const ROLES = [
  { value: 'organizer', label: 'Organizer', description: 'Organize and coordinate event details' },
  { value: 'event_planner', label: 'Event Planner', description: 'Plan and execute event logistics' },
  { value: 'partner', label: 'Partner', description: 'Collaborate on event planning and execution' },
  { value: 'host', label: 'Host', description: 'Host and manage events' },
  { value: 'venue_owner', label: 'Venue Owner', description: 'Own and manage venue operations' },
  { value: 'venue_manager', label: 'Venue Manager', description: 'Manage venue-related information' },
  { value: 'sponsor', label: 'Sponsor', description: 'Sponsor events and track sponsorship details' },
];

const PERMISSION_LEVELS: Record<string, { label: string; icon: typeof Crown; color: string; description: string }> = {
  admin: { label: 'Owner/Admin (CRUD)', icon: Crown, color: 'bg-destructive/10 text-destructive', description: 'Full access — Create, Read, Update, Delete' },
  coordinator: { label: 'Read & Update (RU)', icon: ClipboardList, color: 'bg-primary/10 text-primary', description: 'Can view and update events and resources' },
  viewer: { label: 'Read Only (R)', icon: Eye, color: 'bg-muted-foreground/10 text-muted-foreground', description: 'View-only access to events and data' },
};

const roleColors: Record<string, string> = {
  organizer: "bg-accent/50 text-accent-foreground",
  event_planner: "bg-secondary/50 text-secondary-foreground",
  partner: "bg-primary/10 text-primary",
  host: "bg-primary/20 text-primary",
  venue_owner: "bg-muted text-muted-foreground",
  venue_manager: "bg-muted text-muted-foreground",
  sponsor: "bg-accent/30 text-accent-foreground",
};

// Helper to group user_roles rows by user_id into consolidated entries
interface ConsolidatedUser {
  user_id: string;
  roles: { id: string; role: string; permission_level: PermissionLevel | null; event_id: string | null }[];
  highestPermission: PermissionLevel;
}

function consolidateUserRoles(userRoles: UserRole[]): ConsolidatedUser[] {
  const grouped = new Map<string, ConsolidatedUser>();
  const levelPriority: Record<string, number> = { admin: 3, coordinator: 2, viewer: 1 };

  for (const ur of userRoles) {
    if (!grouped.has(ur.user_id)) {
      grouped.set(ur.user_id, { user_id: ur.user_id, roles: [], highestPermission: 'viewer' });
    }
    const entry = grouped.get(ur.user_id)!;
    entry.roles.push({ id: ur.id, role: ur.role, permission_level: ur.permission_level, event_id: ur.event_id });
    const perm = ur.permission_level || 'viewer';
    if ((levelPriority[perm] || 0) > (levelPriority[entry.highestPermission] || 0)) {
      entry.highestPermission = perm;
    }
  }
  return Array.from(grouped.values());
}

export function RoleManager({ selectedEventFilter = "all" }: { selectedEventFilter?: string }) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [usersWithoutRoles, setUsersWithoutRoles] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionMappings, setPermissionMappings] = useState<Map<string, PermissionLevel>>(new Map());
  const [dataTimestamp, setDataTimestamp] = useState(Date.now());
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = usePermissions();

  // Check if current user is event owner
  const isEventOwner = (): boolean => {
    if (isAdmin()) return true;
    if (!user) return false;
    // Check if user is the owner of the selected event or any event
    if (selectedEventFilter && selectedEventFilter !== 'all') {
      return events.some(e => e.user_id === user.id && e.id === selectedEventFilter);
    }
    return events.some(e => e.user_id === user.id);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!isMounted) return;
      await fetchPermissionMappings();
      if (!isMounted) return;
      await fetchUsers();
      if (!isMounted) return;
      await fetchEvents();
      if (!isMounted) return;
      await fetchChangeRequests();
    };
    fetchData();

    const eventsChannel = supabase
      .channel('role-manager-events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => { if (isMounted) fetchEvents(); })
      .subscribe();

    const rolesChannel = supabase
      .channel('role-manager-user-roles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => { if (isMounted) fetchUsers(); })
      .subscribe();

    const profilesChannel = supabase
      .channel('role-manager-profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { if (isMounted) fetchUsers(); })
      .subscribe();

    const crChannel = supabase
      .channel('role-manager-cr-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'change_requests' }, () => { if (isMounted) fetchChangeRequests(); })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(crChannel);
    };
  }, [selectedEventFilter]);

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('id, title, start_date, created_at, user_id')
        .order('created_at', { ascending: false });
      if (error) throw error;

      if (eventsData && eventsData.length > 0) {
        const userIds = eventsData.map(e => e.user_id).filter(Boolean);
        let profilesMap = new Map<string, string>();
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles').select('user_id, display_name').in('user_id', userIds);
          profilesMap = new Map(profilesData?.map(p => [p.user_id, p.display_name || '']) || []);
        }
        setEvents(eventsData.map(event => ({
          ...event,
          organizer_name: profilesMap.get(event.user_id) || 'Unknown'
        })));
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('[RoleManager] Error fetching events:', error);
      setEvents([]);
    }
  };

  const fetchPermissionMappings = async () => {
    try {
      const { data, error } = await supabase.from('role_permission_groups').select('role, permission_group');
      if (error) throw error;
      setPermissionMappings(new Map(data.map((item: any) => [item.role, item.permission_group as PermissionLevel])));
    } catch (error) {
      console.error('Error fetching permission mappings:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = supabase.from('user_roles').select('id, user_id, role, permission_level, event_id, created_at');
      if (selectedEventFilter && selectedEventFilter !== "all") {
        query = query.or(`event_id.eq.${selectedEventFilter},event_id.is.null`);
      }
      const { data: userRolesData, error: rolesError } = await query;
      if (rolesError) throw rolesError;

      const { data: usersResponse, error: usersError } = await supabase.functions.invoke('get-users-for-roles');
      if (usersError) throw usersError;

      const allUsers = usersResponse?.users?.map((u: any) => ({
        id: u.id, name: u.name, email: u.email, status: 'online', joinedAt: u.created_at || new Date().toISOString(), avatar: u.avatar
      })) || [];

      const usersWithRoles = allUsers.map((u: any) => {
        const userRole = userRolesData?.find(role => role.user_id === u.id);
        return { ...u, role: userRole?.role || 'Member' };
      });
      setUsers(usersWithRoles);

      const unassignedUsers = allUsers.filter((u: any) => !userRolesData?.find(role => role.user_id === u.id)).map((u: any) => ({ ...u, role: 'Member' }));
      setUsersWithoutRoles(unassignedUsers);

      const roleAssignments = userRolesData?.map((role: any) => ({
        id: role.id, user_id: role.user_id, role: role.role, permission_level: role.permission_level, event_id: role.event_id, created_at: role.created_at
      })) || [];
      setUserRoles(roleAssignments);
      setDataTimestamp(Date.now());
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: "Error fetching users", description: "Failed to load users.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (
    roleAssignmentId: string, userId: string,
    newRole: 'host' | 'organizer' | 'event_planner' | 'venue_owner' | 'venue_manager' | 'partner' | 'sponsor' | 'stakeholder' | 'hospitality_provider' | 'manager',
    permissionLevel: PermissionLevel, eventId: string | null = null
  ) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole, permission_level: permissionLevel, event_id: eventId })
        .eq('id', roleAssignmentId)
        .select();
      if (error) throw error;

      // Sync to collaborator_configurations
      await syncToCollaboratorConfig(userId, [newRole], permissionLevel);

      await fetchUsers();
      toast({ title: "Role updated", description: "User role and permission level updated." });
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({ title: "Error updating role", description: error?.message || "Failed to update role.", variant: "destructive" });
    }
  };

  const syncToCollaboratorConfig = async (userId: string, roles: string[], permissionLevel: PermissionLevel) => {
    const permissionText = permissionLevel === 'admin' ? 'CRUD' : permissionLevel === 'coordinator' ? 'RU' : 'R';
    try {
      // Upsert into collaborator_configurations
      const { data: existing } = await supabase
        .from('collaborator_configurations')
        .select('id')
        .eq('assigned_user_id', userId)
        .maybeSingle();

      if (existing) {
        await supabase.from('collaborator_configurations')
          .update({ roles, permission_level_text: permissionText, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('collaborator_configurations')
          .insert({
            assigned_user_id: userId,
            role: roles[0] || 'member',
            collaborator_types: roles,
            roles,
            permission_level_text: permissionText,
            is_coordinator: permissionLevel === 'coordinator',
            is_viewer: permissionLevel === 'viewer',
          });
      }
    } catch (err) {
      console.error('Error syncing collaborator config:', err);
    }
  };

  const getUserInfo = (userId: string) => {
    return users.find(u => u.id === userId) || { id: userId, name: `User ${userId.slice(0, 8)}...`, email: 'Unknown', status: 'active' };
  };

  const fetchChangeRequests = async () => {
    try {
      let query = supabase.from('change_requests')
        .select('id, title, status, priority, description, created_at, event_id, requested_by, field_changes')
        .in('status', ['pending', 'approved']);
      if (selectedEventFilter && selectedEventFilter !== 'all') {
        query = query.eq('event_id', selectedEventFilter);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setChangeRequests(data || []);
    } catch (error) {
      console.error('Error fetching change requests:', error);
    }
  };

  const handleChangeRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(requestId);
      const rpcFunction = action === 'approve' ? 'approve_change_request' : 'reject_change_request';
      const rpcParams: any = { p_change_request_id: requestId };
      if (action === 'reject') rpcParams.p_rejection_reason = rejectionReason || 'No reason provided';

      const { error } = await supabase.rpc(rpcFunction, rpcParams);
      if (error) throw error;

      toast({
        title: action === 'approve' ? 'Request Approved' : 'Request Declined',
        description: `Change request has been ${action === 'approve' ? 'approved' : 'declined'}.`,
      });
      setRejectDialog({ open: false, requestId: null });
      setRejectionReason('');
      await fetchChangeRequests();
    } catch (error: any) {
      console.error('Error handling change request:', error);
      toast({ title: 'Error', description: error.message || 'Failed to process change request.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  // Multi-role change handler for consolidated cards
  const handleMultiRoleChange = async (
    userRolesForUser: ConsolidatedUser['roles'],
    userId: string,
    newRoles: string[],
    permissionLevel: PermissionLevel,
    eventId: string | null
  ) => {
    try {
      // Delete all existing role assignments for this user
      for (const ur of userRolesForUser) {
        await supabase.from('user_roles').delete().eq('id', ur.id);
      }

      // Insert new roles
      for (const role of newRoles) {
        await supabase.functions.invoke('assign-user-role', {
          body: { userId, role, permissionLevel, eventId },
        });
      }

      // Sync to collaborator_configurations
      await syncToCollaboratorConfig(userId, newRoles, permissionLevel);

      await fetchUsers();
      toast({ title: "Roles updated", description: `Updated ${newRoles.length} role(s) for the user.` });
    } catch (error: any) {
      console.error('Error updating roles:', error);
      toast({ title: "Error updating roles", description: error?.message || "Failed.", variant: "destructive" });
    }
  };

  const pendingRequests = changeRequests.filter(cr => cr.status === 'pending');
  const consolidated = consolidateUserRoles(userRoles);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-52 rounded-lg bg-muted animate-pulse" />
          <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold">Collaborator Management</h2>
        </div>
        <Badge variant="outline" className="text-xs">
          {consolidated.length + usersWithoutRoles.length} users
        </Badge>
      </div>

      {/* ====== OWNER: ACTION REQUIRED INBOX ====== */}
      {isEventOwner() && pendingRequests.length > 0 && (
        <Card className="border-amber-300/50 dark:border-amber-700/50 bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/20 rounded-xl shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Bell className="h-4 w-4 text-amber-600" />
              </div>
              <span>Action Required</span>
              <Badge variant="destructive" className="rounded-full text-[10px] h-5 px-2 ml-1">
                {pendingRequests.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {pendingRequests.map((cr) => {
              const fields = cr.field_changes as Record<string, any> | null;
              const fieldEntries = fields ? Object.entries(fields) : [];
              return (
                <div key={cr.id} className="p-4 rounded-xl border bg-background/90 backdrop-blur-sm space-y-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] rounded-full px-2">
                          Change Request
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] rounded-full px-2 ${
                          cr.priority === 'high' || cr.priority === 'critical' 
                            ? 'border-destructive/50 text-destructive' 
                            : 'border-muted-foreground/30'
                        }`}>{cr.priority}</Badge>
                      </div>
                      <p className="text-sm font-semibold">{cr.title}</p>
                      {cr.description && <p className="text-xs text-muted-foreground mt-0.5">{cr.description}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs shrink-0 rounded-lg"
                      onClick={() => navigate(`/dashboard/change-requests/${cr.id}`)}>
                      <FileText className="h-3 w-3 mr-1" />Details
                    </Button>
                  </div>

                  {/* Old → New values */}
                  {fieldEntries.length > 0 && (
                    <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                      {fieldEntries.map(([key, val]) => (
                        <div key={key} className="text-xs flex flex-wrap gap-1">
                          <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="line-through text-muted-foreground">"{val?.oldValue || 'empty'}"</span>
                          <span>→</span>
                          <span className="font-bold text-foreground">"{val?.newValue || 'empty'}"</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-8 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      disabled={actionLoading === cr.id}
                      onClick={() => handleChangeRequestAction(cr.id, 'approve')}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg text-destructive border-destructive/30 hover:bg-destructive/5"
                      disabled={actionLoading === cr.id}
                      onClick={() => setRejectDialog({ open: true, requestId: cr.id })}>
                      <XCircle className="h-3.5 w-3.5 mr-1" />Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ====== CONSOLIDATED COLLABORATOR TABLE ====== */}
      <Card className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm">
        <CardContent className="p-0">
          {/* Table Header (desktop only) */}
          <div className="hidden md:grid md:grid-cols-[2fr_2fr_1.5fr_auto] gap-4 px-5 py-3 border-b bg-muted/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>User</span>
            <span>Roles</span>
            <span>Permission Level</span>
            <span>Actions</span>
          </div>

          {consolidated.length === 0 && usersWithoutRoles.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">Invite team members to get started.</p>
            </div>
          )}

          {/* Assigned Users - consolidated rows */}
          {consolidated.map((cu) => (
            <CollaboratorRow
              key={cu.user_id}
              consolidated={cu}
              userInfo={getUserInfo(cu.user_id)}
              events={events}
              permissionMappings={permissionMappings}
              dataTimestamp={dataTimestamp}
              onMultiRoleChange={handleMultiRoleChange}
            />
          ))}

          {/* Unassigned Users */}
          {usersWithoutRoles.length > 0 && (
            <div className="border-t">
              <div className="px-4 py-2 bg-muted/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <UserPlus className="h-3 w-3" /> Unassigned ({usersWithoutRoles.length})
                </p>
              </div>
              {usersWithoutRoles.map((u) => (
                <UnassignedUserCard
                  key={u.id}
                  user={u}
                  roles={ROLES}
                  events={events}
                  permissionLevels={PERMISSION_LEVELS}
                  permissionMappings={permissionMappings}
                  selectedEventFilter={selectedEventFilter}
                  onAssign={async (userId, role, permissionLevel, eventId) => {
                    const response = await supabase.functions.invoke('assign-user-role', {
                      body: { userId, role, permissionLevel, eventId },
                    });
                    const error = response.error || (response.data && !response.data.success ? { message: response.data.error || 'Unknown error' } : null);
                    if (error) {
                      toast({ title: "Error assigning role", description: error.message, variant: "destructive" });
                    } else {
                      // Also sync to collaborator_configurations
                      await syncToCollaboratorConfig(userId, [role], permissionLevel);
                      toast({ title: "Role assigned", description: "User role has been assigned." });
                      await fetchUsers();
                    }
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => {
        if (!open) { setRejectDialog({ open: false, requestId: null }); setRejectionReason(''); }
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Decline Change Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">Reason for declining</label>
            <Textarea placeholder="Enter reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog({ open: false, requestId: null }); setRejectionReason(''); }}>Cancel</Button>
            <Button variant="destructive" disabled={actionLoading === rejectDialog.requestId}
              onClick={() => { if (rejectDialog.requestId) handleChangeRequestAction(rejectDialog.requestId, 'reject'); }}>
              Decline Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TeamMemberTaskAssignments />
    </div>
  );
}

// ====== COLLABORATOR ROW COMPONENT ======
interface CollaboratorRowProps {
  consolidated: ConsolidatedUser;
  userInfo: { id: string; name: string; email: string; status?: string };
  events: Event[];
  permissionMappings: Map<string, PermissionLevel>;
  dataTimestamp: number;
  onMultiRoleChange: (
    existingRoles: ConsolidatedUser['roles'],
    userId: string,
    newRoles: string[],
    permissionLevel: PermissionLevel,
    eventId: string | null
  ) => void;
}

function CollaboratorRow({ consolidated, userInfo, events, permissionMappings, dataTimestamp, onMultiRoleChange }: CollaboratorRowProps) {
  const currentRoles = consolidated.roles.map(r => r.role);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);
  const [selectedPermission, setSelectedPermission] = useState<PermissionLevel>(consolidated.highestPermission);
  const [isDirty, setIsDirty] = useState(false);

  // Reset when data changes
  useEffect(() => {
    const newRoles = consolidated.roles.map(r => r.role);
    setSelectedRoles(newRoles);
    setSelectedPermission(consolidated.highestPermission);
    setIsDirty(false);
  }, [dataTimestamp, consolidated.user_id]);

  const toggleRole = (roleValue: string) => {
    setSelectedRoles(prev => {
      const next = prev.includes(roleValue) ? prev.filter(r => r !== roleValue) : [...prev, roleValue];
      setIsDirty(true);
      // Auto-suggest permission for newly added role
      if (!prev.includes(roleValue)) {
        const suggested = permissionMappings.get(roleValue);
        if (suggested) setSelectedPermission(suggested);
      }
      return next;
    });
  };

  const handlePermissionChange = (perm: PermissionLevel) => {
    setSelectedPermission(perm);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (selectedRoles.length === 0) return;
    const eventId = consolidated.roles[0]?.event_id || null;
    onMultiRoleChange(consolidated.roles, consolidated.user_id, selectedRoles, selectedPermission, eventId);
    setIsDirty(false);
  };

  const selectedLabels = selectedRoles.map(r => ROLES.find(role => role.value === r)?.label).filter(Boolean);
  const permInfo = PERMISSION_LEVELS[selectedPermission];
  const PermIcon = permInfo?.icon;

  return (
    <div className="border-b last:border-b-0 px-4 py-3 hover:bg-muted/20 transition-colors">
      {/* Mobile layout */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">{userInfo.name || 'Unknown User'}</h4>
            <p className="text-xs text-muted-foreground">{userInfo.email}</p>
          </div>
          {permInfo && PermIcon && (
            <Badge variant="outline" className={`${permInfo.color} text-[10px]`}>
              <PermIcon className="h-3 w-3 mr-1" />{permInfo.label}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {selectedRoles.map(r => {
            const roleInfo = ROLES.find(role => role.value === r);
            return (
              <Badge key={r} className={`${roleColors[r] || 'bg-muted text-muted-foreground'} text-[10px]`}>
                {roleInfo?.label || r}
              </Badge>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Roles</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between text-xs font-normal h-8">
                  <span className="truncate">{selectedLabels.length > 0 ? `${selectedLabels.length} selected` : 'Select...'}</span>
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2 bg-popover z-50" align="start">
                {ROLES.map((role) => (
                  <label key={role.value} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-xs">
                    <Checkbox checked={selectedRoles.includes(role.value)} onCheckedChange={() => toggleRole(role.value)} />
                    {role.label}
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">Permission</label>
            <Select value={selectedPermission} onValueChange={(v) => handlePermissionChange(v as PermissionLevel)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                  <SelectItem key={key} value={key} className="text-xs">{level.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {isDirty && (
          <Button size="sm" className="w-full h-7 text-xs" onClick={handleSave}>Save Changes</Button>
        )}
      </div>

      {/* Desktop layout */}
      <div className="hidden md:grid md:grid-cols-[2fr_2fr_1.5fr_auto] gap-4 items-center">
        <div>
          <h4 className="font-semibold text-sm">{userInfo.name || 'Unknown User'}</h4>
          <p className="text-xs text-muted-foreground">{userInfo.email}</p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between font-normal h-9">
              <span className="truncate text-xs">
                {selectedLabels.length > 0
                  ? selectedLabels.length <= 2
                    ? selectedLabels.join(', ')
                    : `${selectedLabels.length} roles selected`
                  : 'Select roles...'}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-2 bg-popover z-50" align="start">
            {ROLES.map((role) => (
              <label key={role.value} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm">
                <Checkbox checked={selectedRoles.includes(role.value)} onCheckedChange={() => toggleRole(role.value)} />
                {role.label}
              </label>
            ))}
          </PopoverContent>
        </Popover>

        <Select value={selectedPermission} onValueChange={(v) => handlePermissionChange(v as PermissionLevel)}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
              <SelectItem key={key} value={key} className="text-xs">{level.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          {isDirty && (
            <Button size="sm" className="h-8 text-xs px-3" onClick={handleSave}>Save</Button>
          )}
          {!isDirty && selectedRoles.length > 0 && (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {selectedRoles.map(r => (
                <Badge key={r} className={`${roleColors[r] || 'bg-muted text-muted-foreground'} text-[10px]`}>
                  {ROLES.find(role => role.value === r)?.label || r}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
