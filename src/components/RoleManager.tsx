import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, PermissionLevel } from "@/lib/permissions";
import { useChecklistTemplates, groupTemplatesByCategory } from "@/hooks/useChecklistTemplates";
import {
  Shield, Users, Crown, ClipboardList, Eye, CheckCircle2, XCircle,
  FileText, ChevronDown, Bell, UserPlus, Plus, Send, RefreshCw,
  AlertTriangle
} from "lucide-react";
import { UnassignedUserCard } from "./UnassignedUserCard";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

// ====== TYPES ======
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

interface TaskData {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  assigned_coordinator_name: string | null;
  event_id: string | null;
  category: string | null;
  assignment_type: string | null;
  checklist: any;
}

// ====== CONSTANTS ======
const ROLES = [
  { value: 'organizer', label: 'Organizer', description: 'Organize and coordinate event details' },
  { value: 'event_planner', label: 'Event Planner', description: 'Plan and execute event logistics' },
  { value: 'partner', label: 'Partner', description: 'Collaborate on event planning and execution' },
  { value: 'host', label: 'Host', description: 'Host and manage events' },
  { value: 'venue_owner', label: 'Venue Owner', description: 'Own and manage venue operations' },
  { value: 'venue_manager', label: 'Venue Manager', description: 'Manage venue-related information' },
  { value: 'sponsor', label: 'Sponsor', description: 'Sponsor events and track sponsorship details' },
];

const PERMISSION_LEVELS: Record<string, { label: string; shortLabel: string; icon: typeof Crown; color: string; description: string }> = {
  admin: { label: 'Owner/Admin (CRUD)', shortLabel: 'CRUD', icon: Crown, color: 'bg-destructive/10 text-destructive border-destructive/20', description: 'Full access — Create, Read, Update, Delete' },
  coordinator: { label: 'Read & Update (RU)', shortLabel: 'RU', icon: ClipboardList, color: 'bg-primary/10 text-primary border-primary/20', description: 'Can view and update events and resources' },
  viewer: { label: 'Read Only (R)', shortLabel: 'R', icon: Eye, color: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20', description: 'View-only access to events and data' },
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

// ====== HELPERS ======
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

// ====== MAIN COMPONENT ======
export function RoleManager({ selectedEventFilter = "all" }: { selectedEventFilter?: string }) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [usersWithoutRoles, setUsersWithoutRoles] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionMappings, setPermissionMappings] = useState<Map<string, PermissionLevel>>(new Map());
  const [dataTimestamp, setDataTimestamp] = useState(Date.now());
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [permissionFilter, setPermissionFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [crInitiateDialog, setCrInitiateDialog] = useState<{ open: boolean; taskId: string | null; taskTitle: string }>({ open: false, taskId: null, taskTitle: '' });
  const [crDescription, setCrDescription] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const { data: checklistTemplates } = useChecklistTemplates();

  const isEventOwner = (): boolean => {
    if (isAdmin()) return true;
    if (!user) return false;
    if (selectedEventFilter && selectedEventFilter !== 'all') {
      return events.some(e => e.user_id === user.id && e.id === selectedEventFilter);
    }
    return events.some(e => e.user_id === user.id);
  };

  // ====== DATA FETCHING ======
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
      if (!isMounted) return;
      await fetchTasks();
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
    const tasksChannel = supabase
      .channel('role-manager-tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => { if (isMounted) fetchTasks(); })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(crChannel);
      supabase.removeChannel(tasksChannel);
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

  const fetchTasks = async () => {
    try {
      let query = supabase.from('tasks')
        .select('id, title, status, priority, due_date, assigned_to, assigned_coordinator_name, event_id, category, assignment_type, checklist')
        .order('due_date', { ascending: true });
      if (selectedEventFilter && selectedEventFilter !== 'all') {
        query = query.eq('event_id', selectedEventFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // ====== ACTIONS ======
  const syncToCollaboratorConfig = async (userId: string, roles: string[], permissionLevel: PermissionLevel) => {
    const permissionText = permissionLevel === 'admin' ? 'CRUD' : permissionLevel === 'coordinator' ? 'RU' : 'R';
    try {
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

  const handleMultiRoleChange = async (
    userRolesForUser: ConsolidatedUser['roles'],
    userId: string,
    newRoles: string[],
    permissionLevel: PermissionLevel,
    eventId: string | null
  ) => {
    try {
      for (const ur of userRolesForUser) {
        await supabase.from('user_roles').delete().eq('id', ur.id);
      }
      for (const role of newRoles) {
        await supabase.functions.invoke('assign-user-role', {
          body: { userId, role, permissionLevel, eventId },
        });
      }
      await syncToCollaboratorConfig(userId, newRoles, permissionLevel);
      await fetchUsers();
      toast({ title: "Roles updated", description: `Updated ${newRoles.length} role(s) for the user.` });
    } catch (error: any) {
      console.error('Error updating roles:', error);
      toast({ title: "Error updating roles", description: error?.message || "Failed.", variant: "destructive" });
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

      if (action === 'approve') {
        const { error: applyError } = await supabase.rpc('apply_change_request', { p_change_request_id: requestId });
        if (applyError) {
          console.error('Error applying change request:', applyError);
          toast({ title: 'Warning', description: 'Approved but failed to auto-apply changes.', variant: 'destructive' });
        }
      }

      toast({
        title: action === 'approve' ? 'Request Approved & Applied' : 'Request Declined',
        description: action === 'approve'
          ? 'Change request approved and changes applied.'
          : 'Change request has been declined.',
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

  const handleInitiateChangeRequest = async () => {
    if (!crInitiateDialog.taskId || !crDescription.trim()) return;
    try {
      setActionLoading('cr-initiate');
      const eventId = selectedEventFilter && selectedEventFilter !== 'all' ? selectedEventFilter : null;
      const { error } = await supabase.from('change_requests').insert({
        title: `Task Update: ${crInitiateDialog.taskTitle}`,
        description: crDescription.trim(),
        status: 'pending',
        priority: 'medium',
        event_id: eventId,
        requested_by: user?.id,
        task_id: crInitiateDialog.taskId,
      });
      if (error) throw error;
      toast({ title: 'Change Request Submitted', description: 'Your change request has been submitted for review.' });
      setCrInitiateDialog({ open: false, taskId: null, taskTitle: '' });
      setCrDescription('');
      await fetchChangeRequests();
    } catch (error: any) {
      console.error('Error initiating change request:', error);
      toast({ title: 'Error', description: error.message || 'Failed to submit change request.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus as "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled", updated_at: new Date().toISOString() }).eq('id', taskId);
      if (error) throw error;
      toast({ title: 'Task Updated', description: `Task status updated to ${newStatus.replace(/_/g, ' ')}.` });
      await fetchTasks();
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast({ title: 'Error', description: 'Failed to update task status.', variant: 'destructive' });
    }
  };

  const getUserInfo = (userId: string) => {
    return users.find(u => u.id === userId) || { id: userId, name: `User ${userId.slice(0, 8)}...`, email: 'Unknown', status: 'active' };
  };

  // ====== DERIVED DATA ======
  const pendingRequests = changeRequests.filter(cr => cr.status === 'pending');
  const consolidated = consolidateUserRoles(userRoles);

  // Filtered tasks based on task filter
  const filteredTasks = taskFilter === "all" ? tasks : tasks.filter(t => t.id === taskFilter);

  // Group tasks by assigned user name
  const getTasksForUser = (userName: string): TaskData[] => {
    return filteredTasks.filter(t => t.assigned_coordinator_name === userName);
  };

  // Get checklist progress for a task
  const getChecklistProgress = (task: TaskData): { completed: number; total: number } => {
    const checklist = task.checklist as Array<{ label: string; checked: boolean }> | null;
    if (!checklist || !Array.isArray(checklist) || checklist.length === 0) return { completed: 0, total: 0 };
    const completed = checklist.filter(item => item.checked).length;
    return { completed, total: checklist.length };
  };

  // Get the selected event info
  const selectedEvent = events.find(e => e.id === selectedEventFilter);

  // ====== LOADING ======
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

  // ====== RENDER ======
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold">Collaborator Management</h2>
          <Badge variant="outline" className="text-xs">
            {consolidated.length + usersWithoutRoles.length} users
          </Badge>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Role:</span>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Permission:</span>
            <Select value={permissionFilter} onValueChange={setPermissionFilter}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="admin">Owner/Admin (CRUD)</SelectItem>
                <SelectItem value="coordinator">Read & Update (RU)</SelectItem>
                <SelectItem value="viewer">Read Only (R)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Task:</span>
            <Select value={taskFilter} onValueChange={setTaskFilter}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="All Tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                {tasks.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ====== THE RUSTIC GRAPH — 5-COLUMN TABLE ====== */}
      <Card className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider w-[22%]">Role</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider w-[13%]">Permission Level</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider w-[22%]">Task</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider w-[18%]">Checklist</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider w-[25%]">Change Request</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* OWNER/ADMIN ROWS */}
                {(permissionFilter === 'all' || permissionFilter === 'admin') && consolidated.filter(cu => cu.highestPermission === 'admin' && (roleFilter === 'all' || cu.roles.some(r => r.role === roleFilter))).map((cu) => {
                  const userInfo = getUserInfo(cu.user_id);
                  const userTasks = getTasksForUser(userInfo.name);
                  const userCRs = changeRequests.filter(cr => cr.requested_by === cu.user_id || isEventOwner());
                  return (
                    <OwnerAdminRow
                      key={cu.user_id}
                      consolidated={cu}
                      userInfo={userInfo}
                      events={events}
                      selectedEvent={selectedEvent || null}
                      permissionMappings={permissionMappings}
                      dataTimestamp={dataTimestamp}
                      tasks={userTasks}
                      changeRequests={pendingRequests}
                      isOwner={isEventOwner()}
                      actionLoading={actionLoading}
                      onMultiRoleChange={handleMultiRoleChange}
                      onApprove={(id) => handleChangeRequestAction(id, 'approve')}
                      onReject={(id) => setRejectDialog({ open: true, requestId: id })}
                      onNavigateCR={(id) => navigate(`/dashboard/change-requests/${id}`)}
                    />
                  );
                })}

                {/* COLLABORATOR (COORDINATOR) ROWS */}
                {(permissionFilter === 'all' || permissionFilter === 'coordinator') && consolidated.filter(cu => cu.highestPermission === 'coordinator' && (roleFilter === 'all' || cu.roles.some(r => r.role === roleFilter))).map((cu) => {
                  const userInfo = getUserInfo(cu.user_id);
                  const userTasks = getTasksForUser(userInfo.name);
                  return (
                    <CollaboratorRow
                      key={cu.user_id}
                      consolidated={cu}
                      userInfo={userInfo}
                      events={events}
                      permissionMappings={permissionMappings}
                      dataTimestamp={dataTimestamp}
                      tasks={userTasks}
                      checklistTemplates={checklistTemplates || []}
                      onMultiRoleChange={handleMultiRoleChange}
                      onInitiateCR={(taskId, taskTitle) => setCrInitiateDialog({ open: true, taskId, taskTitle })}
                      onUpdateTaskStatus={handleUpdateTaskStatus}
                    />
                  );
                })}

                {/* VIEWER ROWS */}
                {(permissionFilter === 'all' || permissionFilter === 'viewer') && consolidated.filter(cu => cu.highestPermission === 'viewer').map((cu) => {
                  const userInfo = getUserInfo(cu.user_id);
                  const userTasks = getTasksForUser(userInfo.name);
                  return (
                    <ViewerRow
                      key={cu.user_id}
                      consolidated={cu}
                      userInfo={userInfo}
                      events={events}
                      permissionMappings={permissionMappings}
                      dataTimestamp={dataTimestamp}
                      tasks={userTasks}
                      onMultiRoleChange={handleMultiRoleChange}
                    />
                  );
                })}

                {consolidated.length === 0 && usersWithoutRoles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm font-semibold mb-1">No users found</p>
                      <p className="text-xs text-muted-foreground">Invite team members to get started.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden space-y-0 divide-y">
            {(permissionFilter === 'all' || permissionFilter === 'admin') && consolidated.filter(cu => cu.highestPermission === 'admin').map((cu) => {
              const userInfo = getUserInfo(cu.user_id);
              const userTasks = getTasksForUser(userInfo.name);
              return (
                <MobileRow
                  key={cu.user_id}
                  consolidated={cu}
                  userInfo={userInfo}
                  events={events}
                  permissionMappings={permissionMappings}
                  dataTimestamp={dataTimestamp}
                  tasks={userTasks}
                  changeRequests={pendingRequests}
                  isOwner={isEventOwner()}
                  permissionType="admin"
                  checklistTemplates={checklistTemplates || []}
                  actionLoading={actionLoading}
                  onMultiRoleChange={handleMultiRoleChange}
                  onApprove={(id) => handleChangeRequestAction(id, 'approve')}
                  onReject={(id) => setRejectDialog({ open: true, requestId: id })}
                  onInitiateCR={(taskId, taskTitle) => setCrInitiateDialog({ open: true, taskId, taskTitle })}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onNavigateCR={(id) => navigate(`/dashboard/change-requests/${id}`)}
                />
              );
            })}
            {(permissionFilter === 'all' || permissionFilter === 'coordinator') && consolidated.filter(cu => cu.highestPermission === 'coordinator').map((cu) => {
              const userInfo = getUserInfo(cu.user_id);
              const userTasks = getTasksForUser(userInfo.name);
              return (
                <MobileRow
                  key={cu.user_id}
                  consolidated={cu}
                  userInfo={userInfo}
                  events={events}
                  permissionMappings={permissionMappings}
                  dataTimestamp={dataTimestamp}
                  tasks={userTasks}
                  changeRequests={[]}
                  isOwner={false}
                  permissionType="coordinator"
                  checklistTemplates={checklistTemplates || []}
                  actionLoading={actionLoading}
                  onMultiRoleChange={handleMultiRoleChange}
                  onApprove={() => {}}
                  onReject={() => {}}
                  onInitiateCR={(taskId, taskTitle) => setCrInitiateDialog({ open: true, taskId, taskTitle })}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onNavigateCR={() => {}}
                />
              );
            })}
            {(permissionFilter === 'all' || permissionFilter === 'viewer') && consolidated.filter(cu => cu.highestPermission === 'viewer').map((cu) => {
              const userInfo = getUserInfo(cu.user_id);
              const userTasks = getTasksForUser(userInfo.name);
              return (
                <MobileRow
                  key={cu.user_id}
                  consolidated={cu}
                  userInfo={userInfo}
                  events={events}
                  permissionMappings={permissionMappings}
                  dataTimestamp={dataTimestamp}
                  tasks={userTasks}
                  changeRequests={[]}
                  isOwner={false}
                  permissionType="viewer"
                  checklistTemplates={checklistTemplates || []}
                  actionLoading={actionLoading}
                  onMultiRoleChange={handleMultiRoleChange}
                  onApprove={() => {}}
                  onReject={() => {}}
                  onInitiateCR={() => {}}
                  onUpdateTaskStatus={() => {}}
                  onNavigateCR={() => {}}
                />
              );
            })}
            {consolidated.length === 0 && usersWithoutRoles.length === 0 && (
              <div className="text-center py-12 px-4">
                <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-semibold mb-1">No users found</p>
                <p className="text-xs text-muted-foreground">Invite team members to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unassigned Users Section */}
      {usersWithoutRoles.length > 0 && (
        <Card className="rounded-xl border-dashed border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              Unassigned Users ({usersWithoutRoles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
                    await syncToCollaboratorConfig(userId, [role], permissionLevel);
                    toast({ title: "Role assigned", description: "User role has been assigned." });
                    await fetchUsers();
                  }
                }}
              />
            ))}
          </CardContent>
        </Card>
      )}

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

      {/* Initiate Change Request Dialog */}
      <Dialog open={crInitiateDialog.open} onOpenChange={(open) => {
        if (!open) { setCrInitiateDialog({ open: false, taskId: null, taskTitle: '' }); setCrDescription(''); }
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Initiate Change Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Task</label>
              <p className="text-sm text-muted-foreground">{crInitiateDialog.taskTitle}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Description of Change</label>
              <Textarea
                placeholder="Describe the change you're requesting..."
                value={crDescription}
                onChange={(e) => setCrDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCrInitiateDialog({ open: false, taskId: null, taskTitle: '' }); setCrDescription(''); }}>Cancel</Button>
            <Button disabled={!crDescription.trim() || actionLoading === 'cr-initiate'} onClick={handleInitiateChangeRequest}>
              <Send className="h-4 w-4 mr-1" />Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ====== OWNER/ADMIN ROW ======
interface OwnerAdminRowProps {
  consolidated: ConsolidatedUser;
  userInfo: { id: string; name: string; email: string };
  events: Event[];
  selectedEvent: Event | null;
  permissionMappings: Map<string, PermissionLevel>;
  dataTimestamp: number;
  tasks: TaskData[];
  changeRequests: ChangeRequest[];
  isOwner: boolean;
  actionLoading: string | null;
  onMultiRoleChange: (existingRoles: ConsolidatedUser['roles'], userId: string, newRoles: string[], permissionLevel: PermissionLevel, eventId: string | null) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onNavigateCR: (id: string) => void;
}

function OwnerAdminRow({ consolidated, userInfo, events, selectedEvent, permissionMappings, dataTimestamp, tasks, changeRequests, isOwner, actionLoading, onMultiRoleChange, onApprove, onReject, onNavigateCR }: OwnerAdminRowProps) {
  const currentRoles = consolidated.roles.map(r => r.role);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setSelectedRoles(consolidated.roles.map(r => r.role));
    setIsDirty(false);
  }, [dataTimestamp, consolidated.user_id]);

  const toggleRole = (roleValue: string) => {
    setSelectedRoles(prev => {
      const next = prev.includes(roleValue) ? prev.filter(r => r !== roleValue) : [...prev, roleValue];
      setIsDirty(true);
      return next;
    });
  };

  const handleSave = () => {
    if (selectedRoles.length === 0) return;
    const eventId = consolidated.roles[0]?.event_id || null;
    onMultiRoleChange(consolidated.roles, consolidated.user_id, selectedRoles, 'admin', eventId);
    setIsDirty(false);
  };

  const selectedLabels = selectedRoles.map(r => ROLES.find(role => role.value === r)?.label).filter(Boolean);

  return (
    <TableRow className="align-top hover:bg-muted/10">
      {/* ROLE */}
      <TableCell className="py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-sm">{userInfo.name}</p>
              <p className="text-[11px] text-muted-foreground">{userInfo.email}</p>
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between font-normal text-xs h-8">
                <span className="truncate">{selectedLabels.length > 0 ? selectedLabels.join(', ') : 'Select roles...'}</span>
                <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2 bg-popover z-50" align="start">
              {ROLES.map((role) => (
                <label key={role.value} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-xs">
                  <Checkbox checked={selectedRoles.includes(role.value)} onCheckedChange={() => toggleRole(role.value)} />
                  {role.label}
                </label>
              ))}
            </PopoverContent>
          </Popover>
          {selectedEvent && (
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              <p><span className="font-medium">Event:</span> {selectedEvent.title}</p>
              <p><span className="font-medium">Due:</span> {selectedEvent.start_date ? format(new Date(selectedEvent.start_date), 'MMM d, yyyy') : 'TBD'}</p>
            </div>
          )}
          {isDirty && <Button size="sm" className="h-7 text-xs w-full" onClick={handleSave}>Save</Button>}
        </div>
      </TableCell>

      {/* PERMISSION LEVEL */}
      <TableCell className="py-4">
        <Badge className={`${PERMISSION_LEVELS.admin.color} text-[10px] font-bold border`}>
          🔑 CRUD
        </Badge>
      </TableCell>

      {/* TASK */}
      <TableCell className="py-4">
        {tasks.length > 0 ? (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {tasks.slice(0, 5).map(t => (
              <div key={t.id} className="text-xs flex items-center gap-1.5">
                <Badge variant={t.status === 'completed' ? 'default' : 'outline'} className="text-[10px] shrink-0">
                  {t.status.replace(/_/g, ' ')}
                </Badge>
                <span className="truncate">{t.title}</span>
              </div>
            ))}
            {tasks.length > 5 && <p className="text-[10px] text-muted-foreground">+{tasks.length - 5} more</p>}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No tasks assigned</span>
        )}
      </TableCell>

      {/* CHECKLIST */}
      <TableCell className="py-4">
        <Badge variant="outline" className="text-[10px] text-muted-foreground">N/A</Badge>
      </TableCell>

      {/* CHANGE REQUEST */}
      <TableCell className="py-4">
        {isOwner && changeRequests.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {changeRequests.map(cr => {
              const fields = cr.field_changes as Record<string, any> | null;
              const fieldEntries = fields ? Object.entries(fields) : [];
              return (
                <div key={cr.id} className="p-2.5 rounded-lg border bg-background/80 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-accent text-accent-foreground border-accent text-[9px] rounded-full px-1.5">CR</Badge>
                    <Badge variant="outline" className={`text-[9px] rounded-full px-1.5 ${cr.priority === 'high' || cr.priority === 'critical' ? 'border-destructive/50 text-destructive' : ''}`}>{cr.priority}</Badge>
                  </div>
                  <p className="text-[11px] font-medium leading-tight">{cr.title}</p>
                  {fieldEntries.length > 0 && (
                    <div className="bg-muted/30 rounded p-1.5 space-y-0.5">
                      {fieldEntries.slice(0, 3).map(([key, val]) => (
                        <p key={key} className="text-[10px]">
                          <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                          <span className="line-through text-muted-foreground">"{val?.oldValue || ''}"</span> → <span className="font-bold">"{val?.newValue || ''}"</span>
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-6 text-[10px] px-2 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={actionLoading === cr.id} onClick={() => onApprove(cr.id)}>
                      <CheckCircle2 className="h-3 w-3 mr-0.5" />Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-destructive border-destructive/30" disabled={actionLoading === cr.id} onClick={() => onReject(cr.id)}>
                      <XCircle className="h-3 w-3 mr-0.5" />Decline
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1.5" onClick={() => onNavigateCR(cr.id)}>
                      <FileText className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">CM Details — No pending</span>
        )}
      </TableCell>
    </TableRow>
  );
}

// ====== COLLABORATOR ROW ======
interface CollaboratorRowProps {
  consolidated: ConsolidatedUser;
  userInfo: { id: string; name: string; email: string };
  events: Event[];
  permissionMappings: Map<string, PermissionLevel>;
  dataTimestamp: number;
  tasks: TaskData[];
  checklistTemplates: Array<{ id: number; category_name: string; sort_order: number; label: string }>;
  onMultiRoleChange: (existingRoles: ConsolidatedUser['roles'], userId: string, newRoles: string[], permissionLevel: PermissionLevel, eventId: string | null) => void;
  onInitiateCR: (taskId: string, taskTitle: string) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: string) => void;
}

function CollaboratorRow({ consolidated, userInfo, events, permissionMappings, dataTimestamp, tasks, checklistTemplates, onMultiRoleChange, onInitiateCR, onUpdateTaskStatus }: CollaboratorRowProps) {
  const currentRoles = consolidated.roles.map(r => r.role);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setSelectedRoles(consolidated.roles.map(r => r.role));
    setIsDirty(false);
  }, [dataTimestamp, consolidated.user_id]);

  const toggleRole = (roleValue: string) => {
    setSelectedRoles(prev => {
      const next = prev.includes(roleValue) ? prev.filter(r => r !== roleValue) : [...prev, roleValue];
      setIsDirty(true);
      return next;
    });
  };

  const handleSave = () => {
    if (selectedRoles.length === 0) return;
    const eventId = consolidated.roles[0]?.event_id || null;
    onMultiRoleChange(consolidated.roles, consolidated.user_id, selectedRoles, 'coordinator', eventId);
    setIsDirty(false);
  };

  const selectedLabels = selectedRoles.map(r => ROLES.find(role => role.value === r)?.label).filter(Boolean);

  // Get checklist info based on task categories
  const getChecklistForTask = (task: TaskData): { items: string[]; category: string } | null => {
    const category = task.assignment_type || task.category;
    if (!category) return null;
    const grouped = groupTemplatesByCategory(checklistTemplates);
    // Find matching category
    for (const [catName, items] of Object.entries(grouped)) {
      if (catName.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(catName.toLowerCase())) {
        return { items, category: catName };
      }
    }
    return null;
  };

  return (
    <TableRow className="align-top hover:bg-muted/10">
      {/* ROLE */}
      <TableCell className="py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-sm">{userInfo.name}</p>
              <p className="text-[11px] text-muted-foreground">{userInfo.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedRoles.map(r => (
              <Badge key={r} className={`${roleColors[r] || 'bg-muted text-muted-foreground'} text-[10px]`}>
                {ROLES.find(role => role.value === r)?.label || r}
              </Badge>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between font-normal text-xs h-8">
                <span className="truncate">{selectedLabels.length > 0 ? `${selectedLabels.length} role(s)` : 'Select...'}</span>
                <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2 bg-popover z-50" align="start">
              {ROLES.map((role) => (
                <label key={role.value} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-xs">
                  <Checkbox checked={selectedRoles.includes(role.value)} onCheckedChange={() => toggleRole(role.value)} />
                  {role.label}
                </label>
              ))}
            </PopoverContent>
          </Popover>
          {isDirty && <Button size="sm" className="h-7 text-xs w-full" onClick={handleSave}>Save</Button>}
        </div>
      </TableCell>

      {/* PERMISSION LEVEL */}
      <TableCell className="py-4">
        <Badge className={`${PERMISSION_LEVELS.coordinator.color} text-[10px] font-bold border`}>
          ✏️ RU
        </Badge>
      </TableCell>

      {/* TASK */}
      <TableCell className="py-4">
        {tasks.length > 0 ? (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {tasks.map(t => (
              <div key={t.id} className="text-xs space-y-1 p-2 rounded-md border bg-background/50">
                <div className="flex items-center gap-1.5">
                  <Badge variant={t.status === 'completed' ? 'default' : 'outline'} className="text-[10px] shrink-0">
                    {t.status.replace(/_/g, ' ')}
                  </Badge>
                  <span className="truncate font-medium">{t.title}</span>
                </div>
                {t.category && <Badge variant="secondary" className="text-[9px]">{t.category}</Badge>}
                {t.due_date && <p className="text-[10px] text-muted-foreground">Due: {format(new Date(t.due_date), 'MMM d')}</p>}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Auto-populated from tasks</span>
        )}
      </TableCell>

      {/* CHECKLIST */}
      <TableCell className="py-4">
        {tasks.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {tasks.map(t => {
              const checklist = t.checklist as Array<{ label: string; checked: boolean }> | null;
              const checklistInfo = getChecklistForTask(t);
              const items = checklist && Array.isArray(checklist) && checklist.length > 0 ? checklist : null;
              const completed = items ? items.filter(i => i.checked).length : 0;
              const total = items ? items.length : (checklistInfo ? checklistInfo.items.length : 0);
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={t.id} className="space-y-1">
                  <p className="text-[10px] font-medium truncate">{checklistInfo?.category || t.category || 'Checklist'}</p>
                  {total > 0 ? (
                    <>
                      <Progress value={percent} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">{completed}/{total} ({percent}%)</p>
                    </>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic">No items</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Autofilled with resource checklist</span>
        )}
      </TableCell>

      {/* CHANGE REQUEST */}
      <TableCell className="py-4">
        <div className="space-y-2">
          {tasks.length > 0 ? (
            tasks.slice(0, 3).map(t => (
              <div key={t.id} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onInitiateCR(t.id, t.title)}>
                    <Plus className="h-3 w-3 mr-0.5" />Change Request
                  </Button>
                   <Select onValueChange={(status: string) => onUpdateTaskStatus(t.id, status as "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled")}>
                    <SelectTrigger className="h-6 text-[10px] w-[100px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started" className="text-xs">Not Started</SelectItem>
                      <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                      <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                      <SelectItem value="on_hold" className="text-xs">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{t.title}</p>
              </div>
            ))
          ) : (
            <span className="text-xs text-muted-foreground italic">No tasks to request changes for</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ====== VIEWER ROW ======
interface ViewerRowProps {
  consolidated: ConsolidatedUser;
  userInfo: { id: string; name: string; email: string };
  events: Event[];
  permissionMappings: Map<string, PermissionLevel>;
  dataTimestamp: number;
  tasks: TaskData[];
  onMultiRoleChange: (existingRoles: ConsolidatedUser['roles'], userId: string, newRoles: string[], permissionLevel: PermissionLevel, eventId: string | null) => void;
}

function ViewerRow({ consolidated, userInfo, events, permissionMappings, dataTimestamp, tasks, onMultiRoleChange }: ViewerRowProps) {
  return (
    <TableRow className="align-top hover:bg-muted/10 opacity-80">
      {/* ROLE */}
      <TableCell className="py-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="font-semibold text-sm">{userInfo.name}</p>
            <p className="text-[11px] text-muted-foreground">{userInfo.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {consolidated.roles.map(r => (
            <Badge key={r.id} className={`${roleColors[r.role] || 'bg-muted text-muted-foreground'} text-[10px]`}>
              {ROLES.find(role => role.value === r.role)?.label || r.role}
            </Badge>
          ))}
          {consolidated.roles.length === 0 && (
            <Badge variant="outline" className="text-[10px]">General Viewer</Badge>
          )}
        </div>
      </TableCell>

      {/* PERMISSION LEVEL */}
      <TableCell className="py-4">
        <Badge className={`${PERMISSION_LEVELS.viewer.color} text-[10px] font-bold border`}>
          👁️ R
        </Badge>
      </TableCell>

      {/* TASK */}
      <TableCell className="py-4">
        {tasks.length > 0 ? (
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {tasks.map(t => (
              <p key={t.id} className="text-xs text-muted-foreground truncate">{t.title}</p>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* CHECKLIST */}
      <TableCell className="py-4">
        <Badge variant="outline" className="text-[10px] text-muted-foreground">Read Only</Badge>
      </TableCell>

      {/* CHANGE REQUEST */}
      <TableCell className="py-4">
        <Badge variant="outline" className="text-[10px] text-muted-foreground">Read Only</Badge>
      </TableCell>
    </TableRow>
  );
}

// ====== MOBILE ROW ======
interface MobileRowProps {
  consolidated: ConsolidatedUser;
  userInfo: { id: string; name: string; email: string };
  events: Event[];
  permissionMappings: Map<string, PermissionLevel>;
  dataTimestamp: number;
  tasks: TaskData[];
  changeRequests: ChangeRequest[];
  isOwner: boolean;
  permissionType: 'admin' | 'coordinator' | 'viewer';
  checklistTemplates: Array<{ id: number; category_name: string; sort_order: number; label: string }>;
  actionLoading: string | null;
  onMultiRoleChange: (existingRoles: ConsolidatedUser['roles'], userId: string, newRoles: string[], permissionLevel: PermissionLevel, eventId: string | null) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onInitiateCR: (taskId: string, taskTitle: string) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: string) => void;
  onNavigateCR: (id: string) => void;
}

function MobileRow({ consolidated, userInfo, permissionType, tasks, changeRequests, isOwner, checklistTemplates, actionLoading, onApprove, onReject, onInitiateCR, onUpdateTaskStatus, onNavigateCR }: MobileRowProps) {
  const permInfo = PERMISSION_LEVELS[permissionType];
  const PermIcon = permInfo.icon;

  const getChecklistProgress = (task: TaskData) => {
    const checklist = task.checklist as Array<{ label: string; checked: boolean }> | null;
    if (!checklist || !Array.isArray(checklist) || checklist.length === 0) return null;
    const completed = checklist.filter(i => i.checked).length;
    return { completed, total: checklist.length, percent: Math.round((completed / checklist.length) * 100) };
  };

  return (
    <div className="p-4 space-y-3">
      {/* User & Permission */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PermIcon className="h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold text-sm">{userInfo.name}</p>
            <p className="text-[11px] text-muted-foreground">{userInfo.email}</p>
          </div>
        </div>
        <Badge className={`${permInfo.color} text-[10px] font-bold border`}>
          {permInfo.shortLabel}
        </Badge>
      </div>

      {/* Roles */}
      <div className="flex flex-wrap gap-1">
        {consolidated.roles.map(r => (
          <Badge key={r.id} className={`${roleColors[r.role] || 'bg-muted text-muted-foreground'} text-[10px]`}>
            {ROLES.find(role => role.value === r.role)?.label || r.role}
          </Badge>
        ))}
      </div>

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Tasks</p>
          {tasks.slice(0, 3).map(t => {
            const progress = getChecklistProgress(t);
            return (
              <div key={t.id} className="p-2 rounded-md border bg-background/50 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium truncate">{t.title}</span>
                  <Badge variant={t.status === 'completed' ? 'default' : 'outline'} className="text-[9px] shrink-0">
                    {t.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                {progress && (
                  <div className="flex items-center gap-2">
                    <Progress value={progress.percent} className="h-1 flex-1" />
                    <span className="text-[10px] text-muted-foreground">{progress.percent}%</span>
                  </div>
                )}
                {permissionType === 'coordinator' && (
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => onInitiateCR(t.id, t.title)}>
                      <Plus className="h-3 w-3 mr-0.5" />CR
                    </Button>
                    <Select onValueChange={(status: string) => onUpdateTaskStatus(t.id, status as "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled")}>
                      <SelectTrigger className="h-6 text-[10px] w-[90px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started" className="text-xs">Not Started</SelectItem>
                        <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                        <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          })}
          {tasks.length > 3 && <p className="text-[10px] text-muted-foreground">+{tasks.length - 3} more tasks</p>}
        </div>
      )}

      {/* Change Requests (Admin only) */}
      {permissionType === 'admin' && isOwner && changeRequests.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Change Requests ({changeRequests.length})</p>
          {changeRequests.slice(0, 2).map(cr => {
            const fields = cr.field_changes as Record<string, any> | null;
            const fieldEntries = fields ? Object.entries(fields) : [];
            return (
              <div key={cr.id} className="p-2 rounded-md border bg-background/50 space-y-1.5">
                <p className="text-[11px] font-medium">{cr.title}</p>
                {fieldEntries.length > 0 && (
                  <div className="bg-muted/30 rounded p-1.5">
                    {fieldEntries.slice(0, 2).map(([key, val]) => (
                      <p key={key} className="text-[10px]">
                        <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                        "{val?.oldValue || ''}" → "{val?.newValue || ''}"
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-6 text-[10px] px-2 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={actionLoading === cr.id} onClick={() => onApprove(cr.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-destructive" disabled={actionLoading === cr.id} onClick={() => onReject(cr.id)}>
                    Decline
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1" onClick={() => onNavigateCR(cr.id)}>
                    <FileText className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
