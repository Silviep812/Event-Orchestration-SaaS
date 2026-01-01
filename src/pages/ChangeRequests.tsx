import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/lib/permissions";
import { format } from "date-fns";
import { Plus, Search, Filter, FileText, Calendar, User } from "lucide-react";
import { DateRange } from "react-day-picker";

interface ChangeRequest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  event_id: string | null;
  task_id: string | null;
  requested_by: string | null;
  created_at: string;
  event_name?: string;
  task_title?: string;
  requester_name?: string;
}

const ChangeRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRoles, loading: authLoading } = useAuth();
  const { isAdmin, isCoordinator, permissionLevel, loading: permissionsLoading } = usePermissions();
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);
  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({});
  const [hostPermissionLevel, setHostPermissionLevel] = useState<'admin' | 'coordinator' | 'viewer' | null>(null);
  const [hostPermissionLoading, setHostPermissionLoading] = useState(true);

  // Fetch the permission level specifically for the host role
  useEffect(() => {
    const fetchHostPermissionLevel = async () => {
      setHostPermissionLoading(true);

      if (!user) {
        setHostPermissionLevel(null);
        setHostPermissionLoading(false);
        return;
      }

      if (!userRoles.includes('host')) {
        // User doesn't have host role
        setHostPermissionLevel(null);
        setHostPermissionLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('permission_level')
          .eq('user_id', user.id)
          .eq('role', 'host')
          .single();

        if (error) {
          console.error('Error fetching host permission level:', error);
          setHostPermissionLevel(null);
        } else {
          setHostPermissionLevel(data?.permission_level as 'admin' | 'coordinator' | 'viewer' | null);
        }
      } catch (error) {
        console.error('Error fetching host permission level:', error);
        setHostPermissionLevel(null);
      } finally {
        setHostPermissionLoading(false);
      }
    };

    if (user && userRoles.length > 0) {
      fetchHostPermissionLevel();
    } else if (user && userRoles.length === 0) {
      // Roles loaded but user has no roles
      setHostPermissionLevel(null);
      setHostPermissionLoading(false);
    }
  }, [user, userRoles]);

  // Check if user has host role with admin or coordinator permission level
  const hasHostWithAdminOrCoordinator = () => {
    const hasHostRole = userRoles.includes('host');
    const hasRequiredPermission = hostPermissionLevel === 'admin' || hostPermissionLevel === 'coordinator';
    return hasHostRole && hasRequiredPermission;
  };

  useEffect(() => {
    // Wait for auth, permissions, and host permission to finish loading before checking access
    // If we have a user, also wait for userRoles to be populated (not empty during initial load)
    // The issue: authLoading can be false while userRoles is still being fetched (due to setTimeout in useAuth)
    // Also: if user has host role, wait for hostPermissionLevel to be fetched (not null)
    // Also: wait for permissionLevel to be set (not null) so isAdmin() works correctly
    const allLoadingComplete = !authLoading && !permissionsLoading && !hostPermissionLoading;
    // If user exists but userRoles is empty, we're still loading roles - wait
    const rolesReady = !user || userRoles.length > 0;
    // If user has host role, wait for hostPermissionLevel to be fetched
    const hostPermissionReady = !userRoles.includes('host') || hostPermissionLevel !== null;
    // Wait for permissionLevel to be set (needed for isAdmin() check)
    const permissionLevelReady = !user || permissionLevel !== null;
    // Additional safety: if we have a user but any critical data is missing, don't check yet
    const dataComplete = !user || (userRoles.length > 0 && permissionLevel !== null && (!userRoles.includes('host') || hostPermissionLevel !== null));

    if (allLoadingComplete && rolesReady && hostPermissionReady && permissionLevelReady && dataComplete) {
      const isAdminResult = isAdmin();
      const hasHostResult = hasHostWithAdminOrCoordinator();
      const hasAccess = isAdminResult || hasHostResult;
      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "Only Host role with Admin or Coordinator permission level can access change requests",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      fetchChangeRequests();
      fetchEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, permissionsLoading, hostPermissionLoading, permissionLevel, userRoles, hostPermissionLevel, user]);

  // Real-time subscription for change requests list
  useEffect(() => {
    const changeRequestsChannel = supabase
      .channel('change-requests-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'change_requests'
      }, (payload: any) => {
        console.log('Change request list updated:', payload);
        // Refresh the list when any change request is created/updated/deleted
        fetchChangeRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(changeRequestsChannel);
    };
  }, []);

  useEffect(() => {
    fetchUserNames();
  }, [changeRequests]);

  useEffect(() => {
    applyFilters();
  }, [changeRequests, searchQuery, statusFilter, priorityFilter, eventFilter, dateRange]);

  const fetchUserNames = async () => {
    const userIds = Array.from(
      new Set(changeRequests.map((cr) => cr.requested_by).filter(Boolean))
    );
    if (userIds.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds as string[]);

    const nameMap: Record<string, string> = {};
    (data || []).forEach((profile) => {
      nameMap[profile.user_id] = profile.display_name || profile.user_id.substring(0, 8) + "...";
    });
    setUserDisplayNames(nameMap);
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("Create Event")
        .select("userid, event_theme")
        .order("event_start_date", { ascending: false })
        .limit(100);

      if (error) throw error;

      const eventList = (data || []).map((event, index) => ({
        id: event.userid,
        name: Array.isArray(event.event_theme)
          ? event.event_theme.join(", ")
          : event.event_theme || `Event ${index + 1}`,
      }));

      setEvents(eventList);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchChangeRequests = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("change_requests")
        .select("*")
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Batch fetch events and tasks
      const eventIds = (data || []).map(cr => cr.event_id).filter(Boolean) as string[];
      const taskIds = (data || []).map(cr => cr.task_id).filter(Boolean) as string[];

      // Separate UUIDs from TEXT IDs for events
      const uuidEventIds = eventIds.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
      const textEventIds = eventIds.filter(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

      // Fetch events from events table (UUIDs)
      const eventsMap: Record<string, string> = {};
      if (uuidEventIds.length > 0) {
        try {
          const { data: eventsData } = await supabase
            .from("events")
            .select("id, title")
            .in("id", uuidEventIds);

          if (eventsData) {
            eventsData.forEach(event => {
              eventsMap[event.id] = event.title || "Unknown Event";
            });
          }
        } catch (err) {
          console.error("Error batch fetching events:", err);
        }
      }

      // Fetch events from Create Event table (TEXT IDs) - only if we have text IDs
      const createEventsMap: Record<string, string> = {};
      if (textEventIds.length > 0) {
        try {
          const { data: createEventsData } = await supabase
            .from("Create Event")
            .select("userid, event_theme")
            .in("userid", textEventIds);

          if (createEventsData) {
            createEventsData.forEach(event => {
              const theme = Array.isArray(event.event_theme)
                ? event.event_theme.join(", ")
                : event.event_theme || "Unknown Event";
              createEventsMap[event.userid] = theme;
            });
          }
        } catch (err) {
          // Silently fail - some event_ids might not exist in Create Event table
          // This prevents console spam from 406 errors
        }
      }

      // Fetch tasks
      const tasksMap: Record<string, string> = {};
      if (taskIds.length > 0) {
        try {
          const { data: tasksData } = await supabase
            .from("tasks")
            .select("id, title")
            .in("id", taskIds);

          if (tasksData) {
            tasksData.forEach(task => {
              tasksMap[task.id] = task.title;
            });
          }
        } catch (err) {
          console.error("Error batch fetching tasks:", err);
        }
      }

      // Enrich change requests with event and task names
      const enrichedRequests = (data || []).map((cr) => {
        let eventName: string | undefined;
        let taskTitle: string | undefined;

        if (cr.event_id) {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cr.event_id);
          if (isUUID) {
            eventName = eventsMap[cr.event_id];
          } else {
            eventName = createEventsMap[cr.event_id];
          }
        }

        if (cr.task_id) {
          taskTitle = tasksMap[cr.task_id];
        }

        return {
          ...cr,
          event_name: eventName,
          task_title: taskTitle,
        };
      });

      setChangeRequests(enrichedRequests);
    } catch (error) {
      console.error("Error fetching change requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch change requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...changeRequests];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cr) =>
          cr.title?.toLowerCase().includes(query) ||
          cr.description?.toLowerCase().includes(query) ||
          cr.event_name?.toLowerCase().includes(query) ||
          cr.task_title?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((cr) => cr.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((cr) => cr.priority === priorityFilter);
    }

    // Event filter
    if (eventFilter !== "all") {
      filtered = filtered.filter((cr) => cr.event_id === eventFilter);
    }

    // Date range filter
    if (dateRange?.from) {
      filtered = filtered.filter(
        (cr) => new Date(cr.created_at) >= dateRange.from!
      );
    }
    if (dateRange?.to) {
      filtered = filtered.filter(
        (cr) => new Date(cr.created_at) <= dateRange.to!
      );
    }

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "applied":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Applied</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Low</Badge>;
      default:
        return priority ? <Badge variant="outline">{priority}</Badge> : null;
    }
  };

  const uniqueStatuses = Array.from(new Set(changeRequests.map((cr) => cr.status)));
  const uniquePriorities = Array.from(
    new Set(changeRequests.map((cr) => cr.priority).filter(Boolean))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading change requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Change Requests</h1>
          <p className="text-muted-foreground">
            Manage and track all change requests across your events
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/manage-event")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Request
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-5 md:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title, description, event, or task..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {uniquePriorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setEventFilter("all");
                setDateRange(undefined);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Change Requests ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No change requests found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/dashboard/manage-event")}
              >
                Create Your First Change Request
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((cr) => (
                    <TableRow
                      key={cr.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/dashboard/change-requests/${cr.id}`)}
                    >
                      <TableCell className="max-w-xs">
                        <div className="font-medium">{cr.title}</div>
                        {cr.description && (
                          <div className="text-sm text-muted-foreground truncate">
                            {cr.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(cr.status)}</TableCell>
                      <TableCell>{getPriorityBadge(cr.priority)}</TableCell>
                      <TableCell>
                        {cr.event_name ? (
                          <span className="text-sm">{cr.event_name}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cr.task_title ? (
                          <span className="text-sm">{cr.task_title}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cr.requested_by ? (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {userDisplayNames[cr.requested_by] || cr.requested_by.substring(0, 8) + "..."}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(cr.created_at), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/change-requests/${cr.id}`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangeRequests;
