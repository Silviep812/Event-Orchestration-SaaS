import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, BarChart3, Plus, Settings, Palette, CheckSquare, TrendingUp, Activity, Target, Clock, Eye } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Analytics from "@/components/Analytics";

const DashboardHome = () => {
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    taskCompletionRate: 0,
    resourceUtilization: 0,
    leadConversion: 0,
    recentEvents: []
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Array<{
    id: string;
    description: string;
    timestamp: string;
    type: 'task' | 'analytics' | 'resource';
  }>>([]);
  const { toast } = useToast();

  // Fetch real-time analytics data
  useEffect(() => {
    const fetchDashboardAnalytics = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const userId = user.id as string;

        // Fetch events data for current user only
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('id, user_id, title, description, start_date, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        if (eventsError) throw eventsError;

        // Fetch tasks data for current user only
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('created_by', userId);
        if (tasksError) throw tasksError;

        // Get all event IDs for this user
        const userEventIds = (events || []).map(e => e.id);

        // Fetch resources for these events
        let resources = [];
        if (userEventIds.length > 0) {
          const { data: resourcesData, error: resourcesError } = await supabase
            .from('resources')
            .select('allocated, total, event_id')
            .in('event_id', userEventIds);
          if (resourcesError) throw resourcesError;
          resources = resourcesData || [];
        }

        // Calculate analytics
        const totalEvents = events?.length || 0;
        const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
        const totalTasks = tasks?.length || 0;
        const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Calculate resource utilization
        let resourceUtilization = 0;
        if (resources && resources.length > 0) {
          const totalAllocated = resources.reduce((sum, r) => sum + (r.allocated || 0), 0);
          const totalCapacity = resources.reduce((sum, r) => sum + (r.total || 0), 0);
          resourceUtilization = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;
        }

        setAnalytics({
          totalEvents,
          taskCompletionRate,
          resourceUtilization,
          leadConversion: 13, // Placeholder
          recentEvents: events?.slice(0, 3) || []
        });
      } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardAnalytics();
  }, [toast]);

  // Fetch real activity data
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const activitiesData: Array<{
          id: string;
          description: string;
          timestamp: string;
          type: 'task' | 'analytics' | 'resource';
        }> = [];

        // Fetch completed tasks
        const { data: completedTasks } = await supabase
          .from('tasks')
          .select('id, title, updated_at, event_id')
          .eq('created_by', user.id)
          .eq('status', 'completed')
          .order('updated_at', { ascending: false })
          .limit(5);

        // Fetch event titles for completed tasks
        let eventTitleMap: Record<string, string> = {};
        if (completedTasks && completedTasks.length > 0) {
          const eventIds = Array.from(new Set(completedTasks.map(task => task.event_id).filter(Boolean)));
          if (eventIds.length > 0) {
            const { data: eventData } = await supabase
              .from('events')
              .select('id, title')
              .in('id', eventIds);
            (eventData || []).forEach(event => {
              eventTitleMap[event.id] = event.title;
            });
          }
        }

        // Fetch latest tasks (any status, including cancelled)
        const { data: recentTasks } = await supabase
          .from('tasks')
          .select('id, title, updated_at, event_id, status')
          .eq('created_by', user.id)
          .order('updated_at', { ascending: false })
          .limit(5);

        if (recentTasks) {
          recentTasks.forEach(task => {
            const eventTitle = eventTitleMap[task.event_id] || 'Unnamed Event';
            activitiesData.push({
              id: `task-${task.id}`,
              description: `Task "${task.title}" status updated to ${task.status.replace('_', ' ')} in ${eventTitle}`,
              timestamp: task.updated_at,
              type: 'task'
            });
          });
        }

        // Fetch event analytics updates from change_logs
        const { data: analyticsLogs } = await supabase
          .from('change_logs')
          .select('id, entity_type, action, created_at, change_description')
          .eq('changed_by', user.id)
          .eq('entity_type', 'event_analytics')
          .order('created_at', { ascending: false })
          .limit(3);

        if (analyticsLogs) {
          analyticsLogs.forEach(log => {
            activitiesData.push({
              id: `analytics-${log.id}`,
              description: log.change_description || 'Event analytics updated',
              timestamp: log.created_at,
              type: 'analytics'
            });
          });
        }

        // Fetch resource allocation updates
        const { data: resourceLogs } = await supabase
          .from('change_logs')
          .select('id, entity_type, action, created_at, change_description, field_name')
          .eq('changed_by', user.id)
          .eq('entity_type', 'resource')
          .order('created_at', { ascending: false })
          .limit(3);

        if (resourceLogs) {
          resourceLogs.forEach(log => {
            activitiesData.push({
              id: `resource-${log.id}`,
              description: log.change_description || `Resource ${log.field_name || 'allocation'} updated`,
              timestamp: log.created_at,
              type: 'resource'
            });
          });
        }

        // Fetch budget status updates from change_logs
        const { data: budgetLogs } = await supabase
          .from('change_logs')
          .select('id, entity_type, action, created_at, field_name, old_value, new_value, change_description, entity_id')
          .eq('changed_by', user.id)
          .eq('entity_type', 'budget_item')
          .eq('field_name', 'payment_status')
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch event_id for each budget_item
        let budgetEventMap: Record<string, string> = {};
        if (budgetLogs && budgetLogs.length > 0) {
          const budgetItemIds = Array.from(new Set(budgetLogs.map(log => log.entity_id).filter(Boolean)));
          if (budgetItemIds.length > 0) {
            const { data: budgetItems } = await supabase
              .from('budget_items')
              .select('id, event_id')
              .in('id', budgetItemIds);
            (budgetItems || []).forEach(item => {
              budgetEventMap[item.id] = item.event_id;
            });
          }
        }

        // Map event titles for budget items
        let allEventIds = Object.values(budgetEventMap);
        let allEventTitles: Record<string, string> = { ...eventTitleMap };
        if (allEventIds.length > 0) {
          const missingEventIds = allEventIds.filter(eid => !allEventTitles[eid]);
          if (missingEventIds.length > 0) {
            const { data: moreEvents } = await supabase
              .from('events')
              .select('id, title')
              .in('id', missingEventIds);
            (moreEvents || []).forEach(event => {
              allEventTitles[event.id] = event.title;
            });
          }
        }

        if (budgetLogs) {
          budgetLogs.forEach(log => {
            const eventId = budgetEventMap[log.entity_id];
            const eventTitle = allEventTitles[eventId] || 'Unnamed Event';
            activitiesData.push({
              id: `budget-${log.id}`,
              description: `Budget status changed from "${log.old_value}" to "${log.new_value}" in ${eventTitle}`,
              timestamp: log.created_at,
              type: 'resource'
            });
          });
        }

        // Sort all activities by timestamp
        activitiesData.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setActivities(activitiesData.slice(0, 10));
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();
  }, []);

  const stats = [
    {
      title: "Total Events",
      value: loading ? "..." : analytics.totalEvents.toString(),
      description: "Active events this month",
      icon: Calendar,
      trend: "+12%",
      color: "primary"
    },
    {
      title: "Task Completion",
      value: loading ? "..." : `${analytics.taskCompletionRate}%`,
      description: "Average completion rate",
      icon: CheckSquare,
      trend: "+8%",
      color: "secondary"
    },
    {
      title: "Resource Efficiency",
      value: loading ? "..." : `${analytics.resourceUtilization}%`,
      description: "Resource utilization rate",
      icon: Activity,
      trend: "+5%",
      color: "accent"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Event Management Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Track your event performance and analytics in real-time.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/workflow'}>
            <Settings className="h-4 w-4 mr-2" />
            Setup Workflow
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/themes'}>
            <Palette className="h-4 w-4 mr-2" />
            Browse Themes
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/project-management'}>
            <CheckSquare className="h-4 w-4 mr-2" />
            Manage Projects
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/create-event'} className="flex items-center gap-2 bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4" />
            Create New Event
          </Button>
        </div>
      </div>

      {/* Enhanced Analytics KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const gradients = ['bg-gradient-primary', 'bg-gradient-secondary', 'bg-gradient-accent', 'bg-gradient-success'];
          const shadows = ['shadow-primary', 'shadow-secondary', 'shadow-accent', 'shadow-success'];
          return (
            <Card key={index} className={`relative overflow-hidden ${shadows[index]} hover:scale-105 transition-all duration-300 shadow-elegant border-0 bg-gradient-subtle`}>
              <div className={`absolute inset-0 ${gradients[index]} opacity-10`} />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${gradients[index]}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.trend}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="relative overflow-hidden shadow-elegant border-0 bg-gradient-subtle hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-success opacity-5" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-success"></div>
                  Recent Events
                </CardTitle>
                <CardDescription>
                  Your latest event activities and progress
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : analytics.recentEvents.length > 0 ? (
                    analytics.recentEvents.map((event: any, index) => (
                      <div key={event.userid || index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-success bg-opacity-10">
                        <div>
                          <p className="font-medium">{event.title || event.description || 'Unnamed Event'}</p>
                          <p className="text-sm text-muted-foreground">{event.description || 'Event'} • {new Date(event.start_date + 'T00:00:00').toLocaleDateString()}</p>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-gradient-success text-white">
                          Active
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent events found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden shadow-elegant border-0 bg-gradient-subtle hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-accent opacity-5" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-accent"></div>
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key performance indicators overview
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Task Completion Rate</span>
                    <span>{analytics.taskCompletionRate}%</span>
                  </div>
                  <Progress value={analytics.taskCompletionRate} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Resource Utilization</span>
                    <span>{analytics.resourceUtilization}%</span>
                  </div>
                  <Progress value={analytics.resourceUtilization} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="relative overflow-hidden shadow-elegant border-0 bg-gradient-subtle">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-primary"></div>
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and shortcuts for event management
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-gradient-primary bg-opacity-10 border-primary/20 hover:text-white transition-all duration-300"
                  onClick={() => window.location.href = '/dashboard/create-event'}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule New Event
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-gradient-secondary bg-opacity-10 border-secondary/20 hover:text-white transition-all duration-300"
                  onClick={() => window.location.href = '/dashboard/collaborate'}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Team
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-gradient-accent bg-opacity-10 border-accent/20 hover:text-white transition-all duration-300"
                  onClick={() => window.location.href = '/dashboard/analytics'}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Full Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics 
            onInteractionTrack={(interaction) => {
              console.log('Dashboard analytics interaction:', interaction);
            }}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="shadow-elegant border-0 bg-gradient-subtle">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity Feed
              </CardTitle>
              <CardDescription>
                Latest actions and updates across your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity) => {
                    const colorMap = {
                      task: 'bg-secondary',
                      analytics: 'bg-primary',
                      resource: 'bg-accent'
                    };
                    
                    const getRelativeTime = (timestamp: string) => {
                      const now = new Date();
                      const then = new Date(timestamp);
                      const diffMs = now.getTime() - then.getTime();
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMs / 3600000);
                      const diffDays = Math.floor(diffMs / 86400000);
                      
                      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
                      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
                      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
                    };

                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface/50">
                        <div className={`w-2 h-2 rounded-full ${colorMap[activity.type]} mt-2`}></div>
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{getRelativeTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardHome;