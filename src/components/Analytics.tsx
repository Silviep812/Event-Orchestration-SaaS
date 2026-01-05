import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, CheckCircle, Filter, Activity, Target, Clock } from 'lucide-react';
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
  trend: 'up' | 'down' | 'neutral';
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
  onInteractionTrack?: (interaction: UserInteraction) => void;
}

export default function Analytics({ onInteractionTrack }: AnalyticsProps = {}) {
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
  const { toast } = useToast();

  // Track user interactions
  const trackInteraction = (action: string, details: any = {}) => {
    const interaction: UserInteraction = {
      id: crypto.randomUUID(),
      action,
      timestamp: new Date(),
      user_id: 'current-user', // Replace with actual user ID
      details
    };
    
    onInteractionTrack?.(interaction);
    
    // Store in local analytics for behavior insights
    const storedInteractions = JSON.parse(localStorage.getItem('analytics_interactions') || '[]');
    storedInteractions.push(interaction);
    localStorage.setItem('analytics_interactions', JSON.stringify(storedInteractions.slice(-1000))); // Keep last 1000
  };

  // Fetch analytics data from database using KPI view
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch KPI data from view
      const { data: kpiData, error: kpiError } = await supabase
        .from('event_kpi_view')
        .select('*')
        .gte('created_at', filters.dateRange.from.toISOString())
        .lte('created_at', filters.dateRange.to.toISOString());

      if (kpiError) throw kpiError;

      // Aggregate KPIs across all events
      const totalEvents = kpiData?.length || 0;
      const totalTasks = kpiData?.reduce((sum, e) => sum + (e.total_tasks || 0), 0) || 0;
      const completedTasks = kpiData?.reduce((sum, e) => sum + (e.completed_tasks || 0), 0) || 0;
      const totalTaskHours = kpiData?.reduce((sum, e) => sum + (e.total_task_hours || 0), 0) || 0;
      const avgTaskDuration = totalEvents > 0 ? (totalTaskHours / totalEvents) : 0;
      
      // Calculate overall task completion rate
      const taskCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';
      
      // Calculate overall resource utilization
      const totalAllocated = kpiData?.reduce((sum, e) => sum + (e.allocated_resources || 0), 0) || 0;
      const totalResources = kpiData?.reduce((sum, e) => sum + (e.total_resources_count || 0), 0) || 0;
      const resourceUtilizationRate = totalResources > 0 ? ((totalAllocated / totalResources) * 100).toFixed(1) : '0';

      const kpis: KPIData[] = [
        {
          title: "Total Events",
          value: totalEvents.toString(),
          change: "+12%",
          icon: Calendar,
          description: "This period",
          trend: 'up'
        },
        {
          title: "Task Completion Rate",
          value: `${taskCompletionRate}%`,
          change: "+5%",
          icon: CheckCircle,
          description: "Completed tasks",
          trend: 'up'
        },
        {
          title: "Avg Task Duration",
          value: `${avgTaskDuration.toFixed(1)}h`,
          change: "-2h",
          icon: Clock,
          description: "Average hours",
          trend: 'down'
        },
        {
          title: "Resource Utilization",
          value: `${resourceUtilizationRate}%`,
          change: "+8%",
          icon: Activity,
          description: "Efficiency rate",
          trend: 'up'
        },
      ];

      // Process event trends by month from KPI data
      const eventTrends = kpiData?.reduce((acc: any[], event) => {
        const month = format(new Date(event.created_at), 'MMM');
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing.events += 1;
        } else {
          acc.push({ month, events: 1 });
        }
        return acc;
      }, []) || [];

      // Process events by location from KPI data
      const eventsByLocation = kpiData?.reduce((acc: any[], event) => {
        const location = event.location || 'Unknown';
        const existing = acc.find(item => item.location === location);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ location, count: 1, theme: 'General' });
        }
        return acc;
      }, []) || [];

      // Task completion trends from aggregated KPI data
      const inProgressTasks = kpiData?.reduce((sum, e) => sum + (e.in_progress_tasks || 0), 0) || 0;
      const pendingTasks = kpiData?.reduce((sum, e) => sum + (e.pending_tasks || 0), 0) || 0;
      const taskCompletion = [
        { status: 'Completed', value: completedTasks, color: '#22c55e' },
        { status: 'In Progress', value: inProgressTasks, color: '#f59e0b' },
        { status: 'Pending', value: pendingTasks, color: '#ef4444' },
        { status: 'On Hold', value: 0, color: '#6b7280' }, // Not tracked in view currently
      ];

      // Resource utilization by location
      const resourceUtilization = kpiData?.map((event) => ({
        location: event.location || 'Unknown',
        utilization: event.resource_utilization_rate || 0,
        eventTitle: event.title
      })) || [];

      setAnalyticsData({
        kpis,
        eventTrends,
        taskCompletion,
        resourceUtilization,
        conversionRates: [], // Placeholder
        eventsByLocation
      });

      trackInteraction('analytics_data_fetched', { filters, totalEvents, taskCompletionRate });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
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
    fetchAnalyticsData();
  }, [filters]);

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
              <Label htmlFor="date-range" className="text-xs">Date Range</Label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(dateRange) => handleFilterChange('dateRange', dateRange)}
              />
            </div>
            
            <div>
              <Label htmlFor="theme-filter" className="text-xs">Theme</Label>
              <Select value={filters.theme} onValueChange={(value) => handleFilterChange('theme', value)}>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {analyticsData.kpis.map((kpi) => {
          const Icon = kpi.icon
          const isPositive = kpi.trend === 'up'
          
          return (
            <Card key={kpi.title} className="shadow-elegant border-0 bg-gradient-subtle hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center text-xs ${
                    isPositive ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : kpi.trend === 'down' ? (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    ) : null}
                    {kpi.change}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {kpi.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" onClick={() => trackInteraction('tab_viewed', { tab: 'overview' })}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="events" onClick={() => trackInteraction('tab_viewed', { tab: 'events' })}>
            Events
          </TabsTrigger>
          <TabsTrigger value="tasks" onClick={() => trackInteraction('tab_viewed', { tab: 'tasks' })}>
            Tasks
          </TabsTrigger>
          <TabsTrigger value="behavior" onClick={() => trackInteraction('tab_viewed', { tab: 'behavior' })}>
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
                  <div key={task.status} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{task.status}</span>
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