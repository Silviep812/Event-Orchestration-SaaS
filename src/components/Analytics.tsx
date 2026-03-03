import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-picker";
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
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  Filter,
  Activity,
  Target,
  Clock,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";

interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  theme: string;
}

interface KPIData {
  title: string;
  value: string;
  change: string;
  icon: any;
  description: string;
  trend: "up" | "down" | "neutral";
}

interface UserInteraction {
  id: string;
  action: string;
  timestamp: Date;
  user_id: string;
  event_id?: string;
  details: any;
}

interface AnalyticsProps {
  eventId?: string;
  onInteractionTrack?: (interaction: UserInteraction) => void;
}

// Define the expected structure of event_kpi_view data
interface EventKPIData {
  event_id: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
  location: string;
  theme_id: number | null;
  type_id: number | null;
  created_at: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number; // counts tasks with status 'not_started'
  task_completion_rate: number;
  avg_task_duration: number;
  total_task_hours: number;
  total_resources: number;
  allocated_resources: number;
  total_resources_count: number;
  resource_utilization_rate: number;
  total_budget: number;
  total_spent: number;
  budget_utilization_rate: number;
}

export default function Analytics({ eventId, onInteractionTrack }: AnalyticsProps) {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
    theme: "all",
  });

  const [analyticsData, setAnalyticsData] = useState({
    kpis: [] as KPIData[],
    eventTrends: [] as any[],
    taskCompletion: [] as any[],
    resourceUtilization: [] as any[],
    conversionRates: [] as any[],
    eventsByLocation: [] as any[],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Track user interactions
  const trackInteraction = (action: string, details: any = {}) => {
    const interaction: UserInteraction = {
      id: crypto.randomUUID(),
      action,
      timestamp: new Date(),
      user_id: "current-user",
      event_id: eventId,
      details,
    };

    onInteractionTrack?.(interaction);

    const storedInteractions = JSON.parse(localStorage.getItem("analytics_interactions") || "[]");
    storedInteractions.push(interaction);
    localStorage.setItem("analytics_interactions", JSON.stringify(storedInteractions.slice(-1000)));
  };

  // Fetch analytics data filtered by eventId
  const fetchAnalyticsData = async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch KPI data filtered by the selected event
      let query = (supabase.from("event_kpi_view" as any).select("*") as any).eq("event_id", eventId);

      const { data: kpiData, error: kpiError } = (await query) as { data: EventKPIData[] | null; error: any };

      if (kpiError) throw kpiError;

      const eventData = kpiData?.[0] || null;

      // Pull all counts directly from the KPI view
      const totalTasks = eventData?.total_tasks || 0;
      const completedTasks = eventData?.completed_tasks || 0;
      const inProgressTasks = eventData?.in_progress_tasks || 0;
      // 'pending_tasks' in the view counts tasks with status = 'not_started'
      const notStartedTasks = eventData?.pending_tasks || 0;
      const avgTaskDuration = eventData?.avg_task_duration || 0;
      const totalAllocated = eventData?.allocated_resources || 0;
      const totalResources = eventData?.total_resources_count || 0;
      const totalBudget = eventData?.total_budget || 0;
      const totalSpent = eventData?.total_spent || 0;

      // Use pre-calculated rates from the view for accuracy
      const taskCompletionRate = (eventData?.task_completion_rate || 0).toFixed(1);
      const resourceUtilizationRate = (eventData?.resource_utilization_rate || 0).toFixed(1);
      const budgetUtilizationRate = (eventData?.budget_utilization_rate || 0).toFixed(1);

      // Derive on_hold + cancelled from what's left over
      const onHoldAndCancelledTasks = Math.max(0, totalTasks - completedTasks - inProgressTasks - notStartedTasks);

      const kpis: KPIData[] = [
        {
          title: "Total Tasks",
          value: totalTasks.toString(),
          change: `${completedTasks} completed`,
          icon: Calendar,
          description: "For this event",
          trend: completedTasks > 0 ? "up" : "neutral",
        },
        {
          title: "Task Completion",
          value: `${taskCompletionRate}%`,
          change: `${completedTasks}/${totalTasks} done`,
          icon: CheckCircle,
          description: "Completed tasks",
          trend: parseFloat(taskCompletionRate) >= 50 ? "up" : parseFloat(taskCompletionRate) > 0 ? "neutral" : "down",
        },
        {
          title: "Avg Task Duration",
          value: `${Number(avgTaskDuration).toFixed(1)}h`,
          change: `${Number(eventData?.total_task_hours || 0).toFixed(1)}h total`,
          icon: Clock,
          description: "Average hours per task",
          trend: avgTaskDuration > 0 ? "neutral" : "neutral",
        },
        {
          title: "Resource Utilization",
          value: `${resourceUtilizationRate}%`,
          change: `${totalAllocated} of ${totalResources} allocated`,
          icon: Activity,
          description: "Allocated / Total resources",
          trend:
            parseFloat(resourceUtilizationRate) >= 70
              ? "up"
              : parseFloat(resourceUtilizationRate) > 0
                ? "neutral"
                : "down",
        },
        {
          title: "Budget Utilization",
          value: `${budgetUtilizationRate}%`,
          change:
            totalBudget > 0 ? `$${totalSpent.toLocaleString()} of $${totalBudget.toLocaleString()}` : "No budget set",
          icon: DollarSign,
          description: "Spent vs estimated",
          trend:
            parseFloat(budgetUtilizationRate) <= 100
              ? parseFloat(budgetUtilizationRate) > 0
                ? "up"
                : "neutral"
              : "down",
        },
      ];

      // Task completion breakdown for pie chart — maps to actual task_status enum values
      // (not_started, in_progress, completed, on_hold, cancelled)
      const taskCompletion = [
        { status: "Completed", value: completedTasks, color: "#22c55e" },
        { status: "In Progress", value: inProgressTasks, color: "#3b82f6" },
        { status: "Not Started", value: notStartedTasks, color: "#f59e0b" },
        { status: "On Hold / Cancelled", value: onHoldAndCancelledTasks, color: "#6b7280" },
      ];

      // Event trend — single event shows its task breakdown over time
      // Fetch non-archived tasks for this event grouped by month
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("id, status, created_at, due_date, estimated_hours, actual_hours")
        .eq("event_id", eventId)
        .eq("archived", false);

      const eventTrends = (tasksData || [])
        .reduce((acc: any[], task) => {
          const month = format(new Date(task.created_at), "MMM yyyy");
          const existing = acc.find((item) => item.month === month);
          if (existing) {
            existing.tasks += 1;
          } else {
            acc.push({ month, tasks: 1 });
          }
          return acc;
        }, [])
        .sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime());

      // Location data — single event
      const eventsByLocation = eventData?.location ? [{ location: eventData.location, count: 1 }] : [];

      // Resource utilization breakdown per individual resource
      const { data: resourcesData } = await supabase
        .from("resources")
        .select("name, allocated, total")
        .eq("event_id", eventId);

      const resourceUtilization = (resourcesData || []).map((r) => ({
        name: r.name || "Unknown",
        utilization: r.total > 0 ? Math.round((r.allocated / r.total) * 100) : 0,
        allocated: r.allocated,
        total: r.total,
      }));

      // Budget data grouped by category
      const { data: budgetData } = await supabase
        .from("budget_items")
        .select("category, estimated_cost, actual_cost")
        .eq("event_id", eventId)
        .eq("archived", false);

      const budgetByCategory = (budgetData || []).reduce((acc: any[], item) => {
        const existing = acc.find((a) => a.category === item.category);
        if (existing) {
          existing.estimated += item.estimated_cost || 0;
          existing.actual += item.actual_cost || 0;
        } else {
          acc.push({
            category: item.category,
            estimated: item.estimated_cost || 0,
            actual: item.actual_cost || 0,
          });
        }
        return acc;
      }, []);

      setAnalyticsData({
        kpis,
        eventTrends,
        taskCompletion,
        resourceUtilization,
        conversionRates: budgetByCategory,
        eventsByLocation,
      });

      trackInteraction("analytics_data_fetched", { eventId, totalTasks, taskCompletionRate });
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError("Failed to fetch analytics data. Please try again.");
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when eventId or filters change
  useEffect(() => {
    fetchAnalyticsData();
  }, [eventId, filters]);

  const handleFilterChange = (filterType: keyof AnalyticsFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    trackInteraction("filter_applied", { filterType, value });
  };

  // No event selected state
  if (!eventId) {
    return (
      <Card className="shadow-elegant border-0 bg-gradient-subtle">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No Event Selected</h3>
          <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
            Select an event from the list to view its analytics dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-elegant border-0 bg-gradient-subtle">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
          <h3 className="text-lg font-semibold text-destructive">Error Loading Analytics</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Track event performance, user behavior, and scalability metrics for marketing leads.
          </p>
        </div>

        {/* Filters */}
        <Card className="w-full lg:w-auto min-w-[300px] shadow-elegant border-0 bg-gradient-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="date-range" className="text-xs">
                Date Range
              </Label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(dateRange) => handleFilterChange("dateRange", dateRange)}
              />
            </div>

            <div>
              <Label htmlFor="theme-filter" className="text-xs">
                Theme
              </Label>
              <Select value={filters.theme} onValueChange={(value) => handleFilterChange("theme", value)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Themes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Themes</SelectItem>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {analyticsData.kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend === "up";

          return (
            <Card
              key={kpi.title}
              className="shadow-elegant border-0 bg-gradient-subtle hover:shadow-lg transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`flex items-center text-xs ${
                      isPositive ? "text-green-600" : kpi.trend === "down" ? "text-red-600" : "text-muted-foreground"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : kpi.trend === "down" ? (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    ) : null}
                    {kpi.change}
                  </div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" onClick={() => trackInteraction("tab_viewed", { tab: "overview" })}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="events" onClick={() => trackInteraction("tab_viewed", { tab: "events" })}>
            Budget
          </TabsTrigger>
          <TabsTrigger value="tasks" onClick={() => trackInteraction("tab_viewed", { tab: "tasks" })}>
            Tasks
          </TabsTrigger>
          <TabsTrigger value="behavior" onClick={() => trackInteraction("tab_viewed", { tab: "behavior" })}>
            User Behavior
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Task Creation Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.eventTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.eventTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="tasks"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    No task data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Task Completion Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.taskCompletion.some((t) => t.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.taskCompletion.filter((t) => t.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="status"
                      >
                        {analyticsData.taskCompletion
                          .filter((t) => t.value > 0)
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    No tasks yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-elegant border-0 bg-gradient-subtle">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Resource Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.resourceUtilization.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.resourceUtilization}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="utilization" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                  No resources allocated
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Budget by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.conversionRates.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.conversionRates}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="estimated" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Estimated" />
                      <Bar dataKey="actual" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    No budget items
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Event Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.eventsByLocation.length > 0 ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold text-primary">
                        {analyticsData.eventsByLocation[0].location}
                      </div>
                      <div className="text-sm text-muted-foreground">Event Location</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    No location set
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Task Creation by Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData.eventTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.eventTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    No tasks yet
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Task Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.taskCompletion.map((task) => {
                  const total = analyticsData.taskCompletion.reduce((acc, t) => acc + t.value, 0);
                  return (
                    <div key={task.status} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{task.status}</span>
                        <span>{task.value} tasks</span>
                      </div>
                      <Progress value={total > 0 ? (task.value / total) * 100 : 0} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card className="shadow-elegant border-0 bg-gradient-subtle">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                User Behavior Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-surface/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {
                      JSON.parse(localStorage.getItem("analytics_interactions") || "[]").filter(
                        (i: any) => i.event_id === eventId,
                      ).length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Interactions</div>
                </div>
                <div className="text-center p-4 bg-surface/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {
                      JSON.parse(localStorage.getItem("analytics_interactions") || "[]").filter(
                        (i: any) => i.event_id === eventId && i.action === "filter_applied",
                      ).length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Filter Applications</div>
                </div>
                <div className="text-center p-4 bg-surface/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {
                      JSON.parse(localStorage.getItem("analytics_interactions") || "[]").filter(
                        (i: any) => i.event_id === eventId && i.action === "tab_viewed",
                      ).length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Tab Views</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                User interaction tracking helps understand how users navigate and interact with the analytics dashboard.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Budget Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {analyticsData.conversionRates.length > 0
                      ? (() => {
                          const totalEst = analyticsData.conversionRates.reduce(
                            (s: number, i: any) => s + i.estimated,
                            0,
                          );
                          const totalAct = analyticsData.conversionRates.reduce((s: number, i: any) => s + i.actual, 0);
                          return totalEst > 0 ? `${((totalAct / totalEst) * 100).toFixed(1)}%` : "0%";
                        })()
                      : "0%"}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">Budget spent vs estimated</div>
                  <Progress
                    value={(() => {
                      const totalEst = analyticsData.conversionRates.reduce((s: number, i: any) => s + i.estimated, 0);
                      const totalAct = analyticsData.conversionRates.reduce((s: number, i: any) => s + i.actual, 0);
                      return totalEst > 0 ? (totalAct / totalEst) * 100 : 0;
                    })()}
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Resource Utilization Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {analyticsData.kpis.find((k) => k.title === "Resource Utilization")?.value || "0%"}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">Current utilization</div>
                  <Progress
                    value={parseFloat(
                      analyticsData.kpis.find((k) => k.title === "Resource Utilization")?.value?.replace("%", "") ||
                        "0",
                    )}
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
