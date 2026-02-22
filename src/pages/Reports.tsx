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
import { useAuth } from "@/hooks/useAuth";

interface ChangeLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  change_description: string | null;
  changed_by: string;
  created_at: string;
}

interface ReportData {
  totalChanges: number;
  changesByType: { name: string; value: number; color: string }[];
  changesByDate: { date: string; changes: number }[];
  topModifiedEntities: { entity: string; changes: number }[];
  userActivity: { user: string; changes: number }[];
}

type ReportType = 'cm' | 'event-details';

interface EventData {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  venue: string | null;
  status: string | null;
  budget: number | null;
  theme_id: number | null;
  type_id: number | null;
  created_at: string;
  updated_at: string;
}

const Reports = () => {
  const [reportType, setReportType] = useState<ReportType>('cm');
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [eventData, setEventData] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const { toast } = useToast();
  const { user } = useAuth();

  // Reset all data when report type changes
  useEffect(() => {
    // Clear all state to prevent data carryover
    setChangeLogs([]);
    setEventData([]);
    setReportData(null);
    setUserDisplayNames({});
    setDateRange(undefined);
    setEntityTypeFilter('all');
    setActionFilter('all');
    setSelectedEventId('');

    // Fetch fresh data for the selected report type
    if (reportType === 'cm') {
      fetchChangeData();
    } else {
      fetchEvents();
    }
  }, [reportType]);

  useEffect(() => {
    if (reportType === 'cm') {
      fetchChangeData();
    }
  }, [dateRange, entityTypeFilter, actionFilter]);

  // Helper to get display names for user IDs
  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({});
  useEffect(() => {
    const fetchUserNames = async () => {
      const userIds = Array.from(new Set(changeLogs.map(log => log.changed_by)));
      if (userIds.length === 0) return;
      const { data } = await supabase
        .from('profiles')
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

  const fetchEvents = async () => {
    try {
      setLoading(true);
      if (!user) {
        setLoading(false);
        return;
      }

      // Clear old data before fetching new data
      setEventData([]);
      setSelectedEventId('');

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEventData(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch event data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeData = async () => {
    try {
      setLoading(true);

      // Filter by current user to ensure data isolation
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('cm_change_logs')
        .select('*')
        .eq('changed_by', currentUser.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }
      if (entityTypeFilter !== 'all') {
        query = query.eq('entity_type', entityTypeFilter);
      }
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Clear old data before setting new data
      setChangeLogs([]);
      setReportData(null);

      // Set fresh data
      setChangeLogs(data || []);
      generateReportData(data || []);
    } catch (error) {
      console.error('Error fetching change data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch change management data",
        variant: "destructive",
      });
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
      ['Date', 'Entity Type', 'Action', 'Field', 'Old Value', 'New Value', 'Description', 'User ID'],
      ...changeLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.entity_type,
        log.action,
        log.field_name || '',
        `"${(log.old_value || '').replace(/"/g, '""')}"`,
        `"${(log.new_value || '').replace(/"/g, '""')}"`,
        `"${(log.change_description || '').replace(/"/g, '""')}"`,
        log.changed_by,
      ])
    ].map(row => row.join(',')).join('\n');

    const utcDate = new Date().toISOString().split('T')[0];
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Event_Report_${utcDate}_UTC.csv`;
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
          <p className="mt-2 text-muted-foreground">
            {reportType === 'cm'
              ? 'Loading change management reports...'
              : 'Loading event data...'}
          </p>
        </div>
      </div>
    );
  }

  const exportEventReport = () => {
    if (!selectedEventId) {
      toast({
        title: "Error",
        description: "Please select an event to export",
        variant: "destructive",
      });
      return;
    }

    const event = eventData.find(e => e.id === selectedEventId);
    if (!event) return;

    const csvContent = [
      ['Field', 'Value'],
      ['Event Title', `"${(event.title || '').replace(/"/g, '""')}"`],
      ['Description', `"${(event.description || '').replace(/"/g, '""')}"`],
      ['Start Date', event.start_date || ''],
      ['End Date', event.end_date || ''],
      ['Start Time', event.start_time || ''],
      ['End Time', event.end_time || ''],
      ['Location', `"${(event.location || '').replace(/"/g, '""')}"`],
      ['Venue', `"${(event.venue || '').replace(/"/g, '""')}"`],
      ['Status', event.status || ''],
      ['Budget', event.budget?.toString() || ''],
      ['Created At', format(new Date(event.created_at), 'yyyy-MM-dd HH:mm:ss')],
      ['Updated At', format(new Date(event.updated_at), 'yyyy-MM-dd HH:mm:ss')],
    ].map(row => row.join(',')).join('\n');

    const utcDate = new Date().toISOString().split('T')[0];
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Event_Report_${event.title?.replace(/\s+/g, '-') || 'event'}_${utcDate}_UTC.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Event details report exported successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Reports</h1>
          <p className="text-muted-foreground">
            {reportType === 'cm'
              ? 'Track and analyze all change activities across your events and systems'
              : 'View and export current event details for review'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cm">CM Report</SelectItem>
              <SelectItem value="event-details">Event Details</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              // Clear all data and fetch fresh
              setChangeLogs([]);
              setEventData([]);
              setReportData(null);
              setUserDisplayNames({});
              setSelectedEventId('');
              if (reportType === 'cm') {
                setDateRange(undefined);
                setEntityTypeFilter('all');
                setActionFilter('all');
                fetchChangeData();
              } else {
                fetchEvents();
              }
              toast({
                title: "Report Refreshed",
                description: "All data has been cleared and fresh data is being loaded.",
              });
            }}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Generate New Report
          </Button>
          <Button
            onClick={reportType === 'cm' ? exportReport : exportEventReport}
            className="flex items-center gap-2"
            disabled={reportType === 'event-details' && !selectedEventId}
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters / Event Selection */}
      {reportType === 'cm' ? (
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Select Event
            </CardTitle>
            <CardDescription>
              Choose an event to generate a details report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium mb-2 block">Event</label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event..." />
                </SelectTrigger>
                <SelectContent>
                  {eventData.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title} {event.start_date && `(${format(new Date(event.start_date), 'MMM d, yyyy')})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'cm' ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Logs</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData?.totalChanges || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All tracked changes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Entity Types</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uniqueEntityTypes.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Different entity types
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {[...new Set(changeLogs.map(log => log.changed_by))].length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Users making changes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {changeLogs.filter(log =>
                      new Date(log.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                    ).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Changes in last 24h
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Changes by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData?.changesByType || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData?.changesByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend for entity types */}
                  <div className="flex flex-wrap gap-2 mt-4 justify-center">
                    {reportData?.changesByType.map((entry, idx) => (
                      <span key={idx} className="flex items-center gap-2 text-s">
                        <span style={{ background: entry.color, width: 12, height: 12, display: 'inline-block', borderRadius: 2 }} />
                        {entry.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={(reportData?.userActivity || []).map(({ user, changes }) => {
                      const displayName = userDisplayNames[user] || user.substring(0, 8) + '...';
                      return { user: displayName, changes };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="user" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="changes" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
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
                        <TableHead>Field</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {changeLogs.map((log) => (
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
                          <TableCell>
                            {log.field_name && (
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                {log.field_name}
                              </code>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {log.old_value && log.new_value ? (
                              <div className="text-xs">
                                <span className="text-red-500 line-through">
                                  {log.old_value.length > 20 ? log.old_value.substring(0, 20) + '...' : log.old_value}
                                </span>
                                {" → "}
                                <span className="text-green-500">
                                  {log.new_value.length > 20 ? log.new_value.substring(0, 20) + '...' : log.new_value}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {log.change_description || 'No description'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {userDisplayNames[log.changed_by] || log.changed_by.substring(0, 8) + '...'}
                          </TableCell>
                        </TableRow>
                      ))}
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
                        {reportData?.topModifiedEntities[0]?.entity || 'N/A'}
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Event Details Report</CardTitle>
            <CardDescription>
              Current event information for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedEventId ? (
              (() => {
                const event = eventData.find(e => e.id === selectedEventId);
                if (!event) return <p className="text-muted-foreground">Event not found</p>;

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Event Title</label>
                        <p className="text-base font-medium mt-1">{event.title || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <p className="text-base mt-1">{event.status || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                        <p className="text-base mt-1">
                          {event.start_date ? format(new Date(event.start_date), 'PPP') : '—'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">End Date</label>
                        <p className="text-base mt-1">
                          {event.end_date ? format(new Date(event.end_date), 'PPP') : '—'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Start Time</label>
                        <p className="text-base mt-1">{event.start_time || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">End Time</label>
                        <p className="text-base mt-1">{event.end_time || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                        <p className="text-base mt-1">{event.location || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Venue</label>
                        <p className="text-base mt-1">{event.venue || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Budget</label>
                        <p className="text-base mt-1">
                          {event.budget ? `$${event.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created At</label>
                        <p className="text-base mt-1">
                          {format(new Date(event.created_at), 'PPP p')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                        <p className="text-base mt-1">
                          {format(new Date(event.updated_at), 'PPP p')}
                        </p>
                      </div>
                    </div>
                    {event.description && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-base mt-1 whitespace-pre-wrap">{event.description}</p>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Please select an event above to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;