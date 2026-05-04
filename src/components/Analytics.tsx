import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, CheckCircle, Filter, Activity, Target, Clock } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, subMonths } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { eventSelectLifecycleLabel } from "@/lib/eventStatus";
import {
  buildResourceUtilizationChart,
  buildTaskCompletionChart,
  computeAnalyticsKpis,
} from "@/lib/analyticsMetrics";
import { plannerToolsCopy } from "@/lib/nudges";

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
  /** When set (e.g. from Manage Event), metrics default to this event */
  eventId?: string;
  /** In Manage Event tab: show event dropdown so planners can switch scope without leaving the tab */
  showEventScopePicker?: boolean;
  onInteractionTrack?: (interaction: UserInteraction) => void;
}

export default function Analytics({
  eventId,
  showEventScopePicker,
  onInteractionTrack,
}: AnalyticsProps = {}) {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date()
    },
    theme: 'all'
  });
  
  const [analyticsData, setAnalyticsData] = useState({
    kpis: [] as KPIData[],
    eventTrends: [] as any[],
    taskCompletion: [] as any[],
    resourceUtilization: [] as any[],
    conversionRates: [] as any[],
    eventsByLocation: [] as any[]
  });
  
  const [loading, setLoading] = useState(true);
  const [themeOptions, setThemeOptions] = useState<{ id: number; name: string }[]>([]);
  const [eventOptions, setEventOptions] = useState<
    {
      id: string;
      title: string;
      start_date?: string | null;
      end_date?: string | null;
      status?: string | null;
      archived?: boolean | null;
    }[]
  >([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [scopedEventTitle, setScopedEventTitle] = useState<string | null>(null);
  /** Which quick range is active; `custom` when the calendar was used; `null` until user picks a preset. */
  const [datePreset, setDatePreset] = useState<
    "weekly" | "monthly" | "quarterly" | "custom" | null
  >(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryEventId = searchParams.get("eventId");

  useEffect(() => {
    const resolved = eventId || (queryEventId ? queryEventId : undefined);
    if (resolved) {
      setSelectedEventId(resolved);
    }
  }, [eventId, queryEventId]);

  useEffect(() => {
    supabase.from("Themes Directory Catalog").select("id, name").order("name").then(({ data }) => {
      setThemeOptions(data || []);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("events")
      .select("id, title, start_date, end_date, status, archived")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setEventOptions(data || []);
      });
  }, [user?.id]);

  const scopeEventId =
    eventId && !showEventScopePicker
      ? eventId
      : selectedEventId !== "all"
        ? selectedEventId
        : eventId || undefined;

  useEffect(() => {
    if (!scopeEventId) {
      setScopedEventTitle(null);
      return;
    }
    supabase
      .from("events")
      .select("title")
      .eq("id", scopeEventId)
      .maybeSingle()
      .then(({ data }) => {
        setScopedEventTitle(data?.title ?? null);
      });
  }, [scopeEventId]);

  // Track user interactions
  const trackInteraction = (action: string, details: any = {}) => {
    const interaction: UserInteraction = {
      id: crypto.randomUUID(),
      action,
      timestamp: new Date(),
      user_id: user?.id ?? "anonymous",
      details
    };
    
    onInteractionTrack?.(interaction);
    
    // Store in local analytics for behavior insights
    const storedInteractions = JSON.parse(localStorage.getItem('analytics_interactions') || '[]');
    storedInteractions.push(interaction);
    localStorage.setItem('analytics_interactions', JSON.stringify(storedInteractions.slice(-1000))); // Keep last 1000
  };

  // Fetch analytics data from database
  const fetchAnalyticsData = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const fromIso = filters.dateRange.from.toISOString();
      const toIso = filters.dateRange.to.toISOString();

      const activeEventId = scopeEventId;

      let eventsQuery = supabase
        .from("events")
        .select("*")
        .gte("created_at", fromIso)
        .lte("created_at", toIso);
      if (activeEventId) {
        eventsQuery = eventsQuery.eq("id", activeEventId);
      } else if (user) {
        eventsQuery = eventsQuery.eq("user_id", user.id);
      }
      const { data: eventsRaw, error: eventsError } = await eventsQuery;
      if (eventsError) throw eventsError;

      let events = eventsRaw || [];
      if (filters.theme !== "all" && !activeEventId) {
        const tid = Number(filters.theme);
        events = events.filter((e) => e.theme_id === tid);
      }

      const taskScopeIds =
        activeEventId != null && activeEventId !== ""
          ? [activeEventId]
          : events.map((e) => e.id);

      let tasks: any[] = [];
      if (taskScopeIds.length > 0) {
        let tasksQuery = supabase
          .from("tasks")
          .select("*")
          .in("event_id", taskScopeIds)
          .eq("archived", false);
        // All events: tasks created in the selected window. One event: all active (non-archived) tasks for KPIs.
        if (!activeEventId) {
          tasksQuery = tasksQuery.gte("created_at", fromIso).lte("created_at", toIso);
        }
        const { data: tdata, error: tasksError } = await tasksQuery;
        if (tasksError) throw tasksError;
        tasks = tdata || [];
      }

      let budgetQuery = supabase
        .from("budget_items")
        .select("*")
        .gte("created_at", fromIso)
        .lte("created_at", toIso);
      if (taskScopeIds.length > 0) {
        budgetQuery = budgetQuery.in("event_id", taskScopeIds);
      } else if (user?.id) {
        budgetQuery = budgetQuery.eq("created_by", user.id);
      }
      const { data: budgetItems, error: budgetError } = await budgetQuery;

      if (budgetError) throw budgetError;

      const totalEvents = events.length;
      const kpisComputed = computeAnalyticsKpis(tasks || []);
      const {
        completedTasks,
        activeTasks,
        totalTasks,
        taskCompletionRate,
        avgTaskDuration,
        durationSampleCount,
        sumEstimated,
        sumActual,
        resourceUtilizationRate,
        resourceUtilizationDetail,
      } = kpisComputed;

      const kpis: KPIData[] = [
        {
          title: "Total Tasks",
          value: totalTasks.toString(),
          change: "Selected period",
          icon: Target,
          description: activeEventId ? "All tasks for this event in the current view" : "Tasks across your selected scope",
          trend: "neutral",
        },
        {
          title: "Tasks Active",
          value: activeTasks.toString(),
          change: "Not started + in progress + on hold",
          icon: Activity,
          description: "Open work items",
          trend: activeTasks > 0 ? "up" : "neutral",
        },
        {
          title: "Task Completion Rate",
          value: `${taskCompletionRate}%`,
          change: "Completed / total",
          icon: CheckCircle,
          description: "Completed tasks",
          trend: Number(taskCompletionRate) >= 50 ? "up" : "neutral",
        },
        {
          title: "Avg Task Duration",
          value: durationSampleCount ? `${avgTaskDuration.toFixed(1)}h` : "—",
          change: durationSampleCount ? "Mean of tasks with duration" : "Add estimates or dates",
          icon: Clock,
          description: "Tasks that include time estimates or start and end dates",
          trend: "neutral",
        },
        {
          title: "Resource Utilization",
          value: `${resourceUtilizationRate}%`,
          change: resourceUtilizationDetail,
          icon: Users,
          description: activeEventId ? "Hours worked vs planned when estimates exist" : "Across your scope and dates",
          trend: "neutral",
        },
      ];

      // Process event trends by month
      const eventTrends = events?.reduce((acc: any[], event) => {
        const month = format(new Date(event.created_at), 'MMM');
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing.events += 1;
        } else {
          acc.push({ month, events: 1 });
        }
        return acc;
      }, []) || [];

      // Process events by location and theme
      const eventsByLocation = events?.reduce((acc: any[], event) => {
        const location = event.venue || 'Unknown';
        const existing = acc.find(item => item.location === location);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ location, count: 1, theme: 'General' });
        }
        return acc;
      }, []) || [];

      const taskCompletion = buildTaskCompletionChart(completedTasks, tasks || []);

      const resourceUtilization = buildResourceUtilizationChart(
        sumEstimated,
        sumActual,
        activeTasks,
        totalTasks,
      );

      setAnalyticsData({
        kpis,
        eventTrends,
        taskCompletion,
        resourceUtilization,
        conversionRates: [],
        eventsByLocation
      });

      trackInteraction('analytics_data_fetched', { filters, totalEvents, taskCompletionRate });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: plannerToolsCopy.analyticsLoadFailed,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update analytics on event completion
  const updateAnalyticsOnEventCompletion = async (eventId: string) => {
    try {
      const taskCompletionValue = parseFloat(analyticsData.kpis.find(k => k.title === 'Task Completion Rate')?.value?.replace('%', '') || '0');
      
      await supabase
        .from('Event Analytics')
        .upsert({
          event_id: parseInt(eventId),
          event_count_update: 1,
          task_completion_rate: taskCompletionValue,
          resource_util_percent: parseFloat(analyticsData.kpis.find(k => k.title === 'Resource Utilization')?.value?.replace('%', '') || '0'),
          avg_task_duration: parseFloat(analyticsData.kpis.find(k => k.title === 'Avg Task Duration')?.value?.replace('h', '') || '0'),
          event_freq_by_location: JSON.stringify(analyticsData.eventsByLocation)
        });

      trackInteraction('event_completed', { eventId });
      
      toast({
        title: "Analytics Updated",
        description: "Event completion data has been recorded",
      });
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  };

  useEffect(() => {
    void fetchAnalyticsData();
    // Lovable-style “metrics refresh periodically”: soft-refresh computed metrics while this page is open.
    const intervalMs = 5 * 60 * 1000;
    const id = window.setInterval(() => {
      void fetchAnalyticsData({ silent: true });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [filters, eventId, selectedEventId, showEventScopePicker, user?.id]);

  const handleFilterChange = (filterType: keyof AnalyticsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    trackInteraction('filter_applied', { filterType, value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground max-w-3xl">
            {eventId && showEventScopePicker
              ? "Task counts, completion, timing, and resource use for this event. Pick a date range for charts; task KPIs stay tied to the full event."
              : eventId && !showEventScopePicker
                ? "Metrics for the event you selected. Filters above apply."
                : "Totals across your events. Use weekly, monthly, or quarterly presets to change the reporting window."}
          </p>
          {scopeEventId && scopedEventTitle && (
            <p className="text-sm font-medium text-foreground">
              Event: {scopedEventTitle}
            </p>
          )}
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
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick date range">
              <Button
                type="button"
                variant={datePreset === "weekly" ? "default" : "outline"}
                size="sm"
                className={
                  datePreset === "weekly"
                    ? "shadow-sm ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                    : undefined
                }
                aria-pressed={datePreset === "weekly"}
                onClick={() => {
                  setDatePreset("weekly");
                  handleFilterChange("dateRange", {
                    from: subDays(new Date(), 7),
                    to: new Date(),
                  });
                }}
              >
                Weekly
              </Button>
              <Button
                type="button"
                variant={datePreset === "monthly" ? "default" : "outline"}
                size="sm"
                className={
                  datePreset === "monthly"
                    ? "shadow-sm ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                    : undefined
                }
                aria-pressed={datePreset === "monthly"}
                onClick={() => {
                  setDatePreset("monthly");
                  handleFilterChange("dateRange", {
                    from: subMonths(new Date(), 1),
                    to: new Date(),
                  });
                }}
              >
                Monthly
              </Button>
              <Button
                type="button"
                variant={datePreset === "quarterly" ? "default" : "outline"}
                size="sm"
                className={
                  datePreset === "quarterly"
                    ? "shadow-sm ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                    : undefined
                }
                aria-pressed={datePreset === "quarterly"}
                onClick={() => {
                  setDatePreset("quarterly");
                  handleFilterChange("dateRange", {
                    from: subMonths(new Date(), 3),
                    to: new Date(),
                  });
                }}
              >
                Quarterly
              </Button>
            </div>
            <div>
              <Label htmlFor="date-range" className="text-xs">Date Range</Label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(dateRange) => {
                  setDatePreset("custom");
                  handleFilterChange("dateRange", dateRange);
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {scopeEventId
                  ? `One event · ${format(filters.dateRange.from, "MMM d")}–${format(filters.dateRange.to, "MMM d, yyyy")} · KPIs use open tasks for this event; charts follow the dates above.`
                  : `Reporting window: ${format(filters.dateRange.from, "MMM d, yyyy")} – ${format(filters.dateRange.to, "MMM d, yyyy")} · includes tasks and events created in this period.`}
              </p>
            </div>
            
            {(!eventId || showEventScopePicker) && (
              <div>
                <Label htmlFor="event-filter" className="text-xs">
                  {showEventScopePicker ? "Event scope" : "Event"}
                </Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="h-8" id="event-filter">
                    <SelectValue placeholder={showEventScopePicker ? "Select event" : "All Events"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!(showEventScopePicker && eventId) && (
                      <SelectItem value="all">All Events</SelectItem>
                    )}
                    {eventOptions.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.title}
                        <span className="text-muted-foreground">{` · ${eventSelectLifecycleLabel(e)}`}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="theme-filter" className="text-xs">Theme</Label>
              <Select value={filters.theme} onValueChange={(value) => handleFilterChange('theme', value)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Themes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Themes</SelectItem>
                  {themeOptions.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {analyticsData.kpis.map((kpi) => {
          const Icon = kpi.icon
          const isPositive = kpi.trend === "up"
          const isDown = kpi.trend === "down"
          
          return (
            <Card key={kpi.title} className="shadow-elegant border-0 bg-gradient-subtle hover:shadow-lg transition-shadow min-w-0">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium leading-snug min-w-0 pr-1">
                  {kpi.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{kpi.value}</div>
                <div className="mt-2 flex flex-col gap-1.5 min-w-0">
                  <div
                    className={`flex flex-wrap items-center gap-x-1 text-xs ${
                      isPositive ? "text-green-600" : isDown ? "text-red-600" : "text-muted-foreground"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 shrink-0" />
                    ) : isDown ? (
                      <TrendingDown className="h-3 w-3 shrink-0" />
                    ) : null}
                    <span className="leading-snug">{kpi.change}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{kpi.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid h-auto min-h-10 w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4">
          <TabsTrigger
            className="w-full"
            value="overview"
            onClick={() => trackInteraction("tab_viewed", { tab: "overview" })}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            className="w-full"
            value="events"
            onClick={() => trackInteraction("tab_viewed", { tab: "events" })}
          >
            Events
          </TabsTrigger>
          <TabsTrigger
            className="w-full"
            value="tasks"
            onClick={() => trackInteraction("tab_viewed", { tab: "tasks" })}
          >
            Tasks
          </TabsTrigger>
          <TabsTrigger
            className="w-full"
            value="behavior"
            onClick={() => trackInteraction("tab_viewed", { tab: "behavior" })}
          >
            User Behavior
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Event Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.eventTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="events" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.taskCompletion}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="status"
                    >
                      {analyticsData.taskCompletion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {analyticsData.resourceUtilization.length > 0 ? (
            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Resource utilization (hours or task mix)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analyticsData.resourceUtilization}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : null}

          <Card className="shadow-elegant border-0 bg-gradient-subtle">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Event Frequency by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.eventsByLocation}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Event Performance by Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.eventTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="events" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-0 bg-gradient-subtle">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Events by Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.eventsByLocation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ location, count }) => `${location}: ${count}`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="count"
                    >
                      {analyticsData.eventsByLocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.8 - index * 0.1})`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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
                  Average Task Duration Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.eventTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="events" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
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
                {analyticsData.taskCompletion.map((task, index) => (
                  <div key={`${task.status}-${index}`} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">
                        {String(task.status || "").replace(/_/g, " ") || "—"}
                      </span>
                      <span>{task.value} tasks</span>
                    </div>
                    <Progress 
                      value={(task.value / analyticsData.taskCompletion.reduce((acc, t) => acc + t.value, 0)) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
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
                  <div className="text-2xl font-bold text-primary">127</div>
                  <div className="text-sm text-muted-foreground">Page Views</div>
                </div>
                <div className="text-center p-4 bg-surface/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">45</div>
                  <div className="text-sm text-muted-foreground">Filter Applications</div>
                </div>
                <div className="text-center p-4 bg-surface/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">23</div>
                  <div className="text-sm text-muted-foreground">Chart Interactions</div>
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
                  Lead to Event Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6">
                  <div className="text-4xl font-bold text-primary mb-2">12.8%</div>
                  <div className="text-sm text-muted-foreground mb-4">Average conversion rate</div>
                  <Progress value={12.8} className="h-3" />
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
                  <div className="text-4xl font-bold text-primary mb-2">75.5%</div>
                  <div className="text-sm text-muted-foreground mb-4">Current utilization</div>
                  <Progress value={75.5} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}