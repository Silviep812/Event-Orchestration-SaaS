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

const Reports = () => {
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchChangeData();
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

  const fetchChangeData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('change_logs')
        .select('*')
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
        log.old_value || '',
        log.new_value || '',
        log.change_description || '',
        log.changed_by,
      ])
    ].map(row => row.join(',')).join('\n');

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
          <h1 className="text-3xl font-bold tracking-tight">Change Management Reports</h1>
          <p className="text-muted-foreground">
            Track and analyze all change activities across your events and systems
          </p>
        </div>
        <Button onClick={exportReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
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
          <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-3 gap-4">
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
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                          {log.changed_by.substring(0, 8)}...
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
    </div>
  );
};

export default Reports;