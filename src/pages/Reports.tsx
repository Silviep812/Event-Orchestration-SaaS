import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getLifecycleTableBadge } from "@/lib/eventStatus";

interface ChangeLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  event_id: string | null;
  metadata: Record<string, unknown> | null;
  changed_by: string | null;
  created_at: string;
}

interface ReportData {
  totalChanges: number;
  changesByType: { name: string; value: number; color: string }[];
  changesByDate: { date: string; changes: number }[];
  topModifiedEntities: { entity: string; changes: number }[];
  userActivity: { user: string; changes: number }[];
}

interface EventPlanRow {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  venue: string | null;
  budget: number | null;
  expected_attendees: number | null;
  themeName: string;
  tasksDone: number;
  tasksTotal: number;
  updated_at: string | null;
}

const Reports = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dueSoonCount, setDueSoonCount] = useState<number | null>(null);
  const [vendorCategoryRows, setVendorCategoryRows] = useState<number | null>(null);
  const [eventPlanRows, setEventPlanRows] = useState<EventPlanRow[]>([]);
  const [eventPlanLoading, setEventPlanLoading] = useState(false);
  const { toast } = useToast();

  const tabFromUrl = searchParams.get("tab");
  const urlToPanel = (p: string | null): string => {
    if (p === "change-requests") return "change-requests";
    if (p === "analytics") return "analytics";
    if (p === "detailed") return "detailed";
    if (p === "trends") return "trends";
    return "overview";
  };
  const panelToUrl = (panel: string): string => {
    if (panel === "overview") return "event-plan";
    return panel;
  };

  const [activeTab, setActiveTab] = useState(() => urlToPanel(tabFromUrl));
  useEffect(() => {
    setActiveTab(urlToPanel(searchParams.get("tab")));
  }, [searchParams]);

  const changeRequestLogs = changeLogs.filter((l) => {
    const meta = l.metadata ? JSON.stringify(l.metadata).toLowerCase() : "";
    return (
      /change.?request/i.test(l.entity_type || "") ||
      /change.?request/i.test(l.action || "") ||
      meta.includes("change request")
    );
  });

  const onReportTabChange = (v: string) => {
    setActiveTab(v);
    setSearchParams({ tab: panelToUrl(v) }, { replace: true });
  };

  useEffect(() => {
    fetchChangeData();
  }, [dateRange, entityTypeFilter, actionFilter]);

  useEffect(() => {
    (async () => {
      const { count, error: e1 } = await supabase
        .from("due_soon_events")
        .select("*", { count: "exact", head: true });
      if (!e1) setDueSoonCount(count ?? 0);
      const { data: vc, error: e2 } = await supabase.from("vendor_category_counts").select("event_id");
      if (!e2) setVendorCategoryRows(vc?.length ?? 0);
    })();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setEventPlanRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setEventPlanLoading(true);
      try {
        const { data: evs, error: evErr } = await supabase
          .from("events")
          .select("id, title, start_date, end_date, status, venue, budget, expected_attendees, theme_id, updated_at, archived")
          .eq("user_id", user.id)
          .eq("archived", false)
          .order("start_date", { ascending: true });
        if (evErr) throw evErr;
        const list = evs || [];
        const themeIds = [...new Set(list.map((e) => e.theme_id).filter((x): x is number => x != null))];
        let themeMap: Record<number, string> = {};
        if (themeIds.length > 0) {
          const { data: th } = await supabase.from("event_themes").select("id, name").in("id", themeIds);
          themeMap = Object.fromEntries((th || []).map((t) => [t.id, t.name || ""]));
        }
        const eventIds = list.map((e) => e.id);
        let taskByEvent: Record<string, { total: number; done: number }> = {};
        if (eventIds.length > 0) {
          const { data: tasks } = await supabase
            .from("tasks")
            .select("event_id, status")
            .in("event_id", eventIds);
          for (const id of eventIds) {
            taskByEvent[id] = { total: 0, done: 0 };
          }
          for (const t of tasks || []) {
            const eid = t.event_id as string;
            if (!eid || !taskByEvent[eid]) continue;
            taskByEvent[eid].total += 1;
            if (t.status === "completed" || t.status === "cancelled") {
              taskByEvent[eid].done += 1;
            }
          }
        }
        const rows: EventPlanRow[] = list.map((e) => {
          const tid = e.theme_id ?? undefined;
          const tstat = e.id ? taskByEvent[e.id] : { total: 0, done: 0 };
          return {
            id: e.id,
            title: e.title,
            start_date: e.start_date,
            end_date: e.end_date,
            status: e.status,
            venue: e.venue,
            budget: e.budget,
            expected_attendees: e.expected_attendees,
            themeName: tid != null ? themeMap[tid] || "—" : "—",
            tasksDone: tstat.done,
            tasksTotal: tstat.total,
            updated_at: e.updated_at,
          };
        });
        if (!cancelled) setEventPlanRows(rows);
      } catch (e: unknown) {
        console.error(e);
        if (!cancelled) setEventPlanRows([]);
      } finally {
        if (!cancelled) setEventPlanLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({});
  useEffect(() => {
    const fetchUserNames = async () => {
      const userIds = Array.from(new Set(changeLogs.map(log => log.changed_by).filter(Boolean))) as string[];
      if (userIds.length === 0) return;
      const { data } = await supabase
        .from('user_profiles_teammate_view')
        .select('user_id, display_name')
        .in('user_id', userIds);
      const nameMap: Record<string, string> = {};
      (data || []).forEach(profile => {
        nameMap[profile.user_id] = profile.display_name || profile.user_id.substring(0, 8) + '...';
      });
      setUserDisplayNames(nameMap);
    };
    fetchUserNames();
  }, [changeLogs]);

  const mapActivityRowToChangeLog = (row: Record<string, unknown>): ChangeLog | null => {
    const id = row.id;
    const entity_type = row.entity_type;
    const action = row.action;
    const created_at = row.created_at;
    if (typeof id !== "string" || typeof entity_type !== "string" || typeof action !== "string" || typeof created_at !== "string") {
      return null;
    }
    return {
      id,
      entity_type,
      entity_id: typeof row.entity_id === "string" ? row.entity_id : null,
      action,
      event_id: typeof row.event_id === "string" ? row.event_id : null,
      metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : null,
      changed_by: typeof row.changed_by === "string" ? row.changed_by : null,
      created_at,
    };
  };

  const fetchChangeData = async () => {
    try {
      setLoading(true);

      // Prefer activity_feed (explicit GRANT in migrations, same rows as cm_activity, same RLS).
      const runQuery = (source: string) => {
        let query = (supabase.from as any)(source).select("*").order("created_at", { ascending: false });
        if (dateRange?.from) {
          query = query.gte("created_at", dateRange.from.toISOString());
        }
        if (dateRange?.to) {
          query = query.lte("created_at", dateRange.to.toISOString());
        }
        if (entityTypeFilter !== "all") {
          query = query.eq("entity_type", entityTypeFilter);
        }
        if (actionFilter !== "all") {
          query = query.eq("action", actionFilter);
        }
        return query;
      };

      let { data, error } = await runQuery("activity_feed");
      if (error) {
        const retry = await runQuery("cm_activity");
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      const logs = (data || [])
        .map((row) => mapActivityRowToChangeLog(row as Record<string, unknown>))
        .filter((log): log is ChangeLog => log !== null);
      setChangeLogs(logs);
      generateReportData(logs);
    } catch (error: unknown) {
      console.error("Error fetching change data:", error);
      const detail =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : "Unknown error";
      toast({
        title: "Error",
        description: `Failed to fetch change management data: ${detail}`,
        variant: "destructive",
      });
      setChangeLogs([]);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = (logs: ChangeLog[]) => {
    // Changes by type
    const typeCount: { [key: string]: number } = {};
    logs.forEach(log => {
      typeCount[log.entity_type] = (typeCount[log.entity_type] || 0) + 1;
    });

    const changesByType = Object.entries(typeCount).map(([name, value], index) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value,
      color: `hsl(${index * 45}, 70%, 50%)`,
    }));

    // Changes by date (last 30 days)
    const dateCount: { [key: string]: number } = {};
    logs.forEach(log => {
      const date = format(new Date(log.created_at), 'MMM dd');
      dateCount[date] = (dateCount[date] || 0) + 1;
    });

    const changesByDate = Object.entries(dateCount)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, changes]) => ({ date, changes }));

    // Top modified entities (group by entity type)
    const entityTypeCount: { [key: string]: number } = {};
    logs.forEach(log => {
      entityTypeCount[log.entity_type] = (entityTypeCount[log.entity_type] || 0) + 1;
    });
    const topModifiedEntities = Object.entries(entityTypeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([entity, changes]) => ({ entity: entity.replace('_', ' ').toUpperCase(), changes }));

    // User activity
    const userCount: { [key: string]: number } = {};
    logs.forEach(log => {
      if (!log.changed_by) return;
      userCount[log.changed_by] = (userCount[log.changed_by] || 0) + 1;
    });

    const userActivity = Object.entries(userCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([user, changes]) => ({
        user, // always store user id here
        changes
      }));

    setReportData({
      totalChanges: logs.length,
      changesByType,
      changesByDate,
      topModifiedEntities,
      userActivity,
    });
  };

  const exportReport = () => {
    const csvContent = [
      ['Date', 'Entity Type', 'Action', 'Event ID', 'Entity ID', 'Metadata', 'User ID'],
      ...changeLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.entity_type,
        log.action,
        log.event_id || '',
        log.entity_id || '',
        log.metadata ? JSON.stringify(log.metadata) : '',
        log.changed_by || '',
      ])
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `change-management-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report exported successfully",
    });
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'created': return 'default';
      case 'updated': return 'secondary';
      case 'deleted': return 'destructive';
      case 'assigned': return 'outline';
      default: return 'secondary';
    }
  };

  const uniqueEntityTypes = [...new Set(changeLogs.map(log => log.entity_type))];
  const uniqueActions = [...new Set(changeLogs.map(log => log.action))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading change management reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Event plan snapshot and change-request activity — details are in each tab below.
          </p>
        </div>
        <Button onClick={exportReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {(dueSoonCount !== null || vendorCategoryRows !== null) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Events starting within 48h</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{dueSoonCount ?? "—"}</p>
              <p className="text-xs text-muted-foreground">From view due_soon_events</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vendor / resource selection rows</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{vendorCategoryRows ?? "—"}</p>
              <p className="text-xs text-muted-foreground">From view vendor_category_counts</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Entity Type</label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueEntityTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDateRange(undefined);
                  setEntityTypeFilter('all');
                  setActionFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={onReportTabChange} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Event Plan Report</TabsTrigger>
          <TabsTrigger value="change-requests">Change Request Report</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Logs</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Plan Report</CardTitle>
              <CardDescription>
                Event plan report is a single schema-style table: one row per active (non-archived) event. Columns
                update as you work in Manage event, Project Management, and timelines, so planners see how the plan
                evolves. Resource line items and collaborator checklists are maintained in{" "}
                <strong>Project Management</strong> (not duplicated here). Use <strong>Manage event</strong> or{" "}
                <strong>Create change request</strong> in the last columns as needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventPlanLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading event plans…</p>
              ) : eventPlanRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No active events yet. Create an event to see your plan here.
                </p>
              ) : (
                <ScrollArea className="h-[min(70vh,560px)] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Theme</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Attendees</TableHead>
                        <TableHead>Tasks (done / total)</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Manage event</TableHead>
                        <TableHead className="text-right">Create change request</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventPlanRows.map((row) => {
                        const statusBadge = getLifecycleTableBadge({
                          status: row.status,
                          start_date: row.start_date,
                          end_date: row.end_date,
                          archived: false,
                        });
                        return (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium max-w-[12rem] truncate">{row.title}</TableCell>
                          <TableCell className="text-sm">{row.themeName}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {row.start_date
                              ? format(new Date(row.start_date + "T12:00:00"), "MMM d, yyyy")
                              : "—"}
                            {row.end_date ? ` → ${format(new Date(row.end_date + "T12:00:00"), "MMM d, yyyy")}` : ""}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant} className="capitalize">
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-[10rem] truncate">{row.venue || "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.budget != null ? `$${Number(row.budget).toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.expected_attendees != null ? row.expected_attendees : "—"}
                          </TableCell>
                          <TableCell className="text-sm tabular-nums">
                            {row.tasksTotal === 0
                              ? "—"
                              : `${row.tasksDone} / ${row.tasksTotal}`}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {row.updated_at
                              ? format(new Date(row.updated_at), "MMM d, yyyy HH:mm")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="link" className="h-auto p-0" asChild>
                              <Link to={`/dashboard/manage-event?eventId=${row.id}`}>Open</Link>
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="link" className="h-auto p-0" asChild>
                              <Link
                                to={`/dashboard/project-management?eventId=${encodeURIComponent(row.id)}&tab=change-management`}
                              >
                                Open
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="change-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Request Report</CardTitle>
              <CardDescription>
                Activity rows tied to change requests. Adjust filters above to change the date range.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changeRequestLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No change request rows in this range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      changeRequestLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>{log.entity_type}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell className="text-xs">
                            {log.changed_by
                              ? userDisplayNames[log.changed_by] ||
                                `${log.changed_by.substring(0, 8)}…`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData?.changesByDate || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="changes" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Modified Entities</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData?.topModifiedEntities || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="entity" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="changes" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Change Logs</CardTitle>
              <CardDescription>
                Complete audit trail of all system changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changeLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No activity logged yet. Changes to events and tasks will appear here automatically.
                        </TableCell>
                      </TableRow>
                    ) : changeLogs.map((log) => {
                      const meta = log.metadata as Record<string, unknown> | null;
                      const detail = meta
                        ? Object.entries(meta)
                            .filter(([, v]) => v !== null && v !== undefined)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')
                            .substring(0, 60)
                        : '';
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.entity_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="text-xs text-muted-foreground">
                              {detail || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.changed_by
                              ? (userDisplayNames[log.changed_by] || log.changed_by.substring(0, 8) + '...')
                              : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Peak Activity Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const hourChanges = changeLogs.filter(log => 
                      new Date(log.created_at).getHours() === hour
                    ).length;
                    const maxChanges = Math.max(...Array.from({ length: 24 }, (_, h) => 
                      changeLogs.filter(log => new Date(log.created_at).getHours() === h).length
                    ));
                    const percentage = maxChanges > 0 ? (hourChanges / maxChanges) * 100 : 0;
                    
                    return (
                      <div key={hour} className="flex items-center space-x-2">
                        <span className="text-xs w-12">
                          {hour.toString().padStart(2, '0')}:00
                        </span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs w-8">{hourChanges}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Most Active Day</span>
                    <Badge>
                      {changeLogs.length > 0 ? format(
                        new Date(changeLogs.reduce((a, b) => 
                          new Date(a.created_at) > new Date(b.created_at) ? a : b
                        ).created_at), 'EEEE'
                      ) : 'N/A'}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Most Changed Entity</span>
                    <Badge variant="secondary">
                      {reportData?.topModifiedEntities?.[0]?.entity || 'N/A'}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Common Action</span>
                    <Badge variant="outline">
                      {uniqueActions.reduce((a, b) => 
                        changeLogs.filter(log => log.action === a).length >
                        changeLogs.filter(log => log.action === b).length ? a : b
                      , uniqueActions[0] || 'N/A')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;