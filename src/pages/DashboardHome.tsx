import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, BarChart3, Plus, Settings, Palette, CheckSquare, Activity, Eye, LayoutDashboard, ClipboardList } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Analytics from "@/components/Analytics";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trialBannerText } from "@/lib/trialLimits";
import { plannerToolsCopy } from "@/lib/nudges";
import { cn } from "@/lib/utils";
import { getDashboardRecentEventStatusBadge } from "@/lib/eventStatus";
import { useCreateEventEntryPath } from "@/hooks/useCreateEventEntryPath";

const DashboardHome = () => {
  const navigate = useNavigate();
  const createEventPath = useCreateEventEntryPath();
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    taskCompletionRate: 0,
    resourceUtilization: 0,
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

        // Fetch events data for current user only (exclude archived from the main list)
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('id, user_id, title, description, start_date, end_date, created_at, venue, status, archived')
          .eq('user_id', userId)
          .neq('archived', true)
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
          recentEvents: events?.slice(0, 3) || []
        });
      } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        toast({
          title: "Error",
          description: plannerToolsCopy.dashboardLoadFailed,
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

        // Fetch all cm_change_logs for the user
        const { data: changeLogs } = await supabase
          .from('cm_change_logs')
          .select('id, entity_type, action, created_at, field_name, old_value, new_value, change_description, entity_id')
          .eq('changed_by', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        // Map event names for all change logs
        let changeLogEventMap: Record<string, string> = {};
        let allEventTitles: Record<string, string> = {};
        if (changeLogs && changeLogs.length > 0) {
          // Collect all possible event_ids from entity_id (for budget_item, workflow, task, etc.)
          const budgetItemIds = changeLogs.filter(log => log.entity_type === 'budget_item').map(log => log.entity_id).filter(Boolean);
          const workflowIds = changeLogs.filter(log => log.entity_type === 'workflow').map(log => log.entity_id).filter(Boolean);
          const taskIds = changeLogs.filter(log => log.entity_type === 'task').map(log => log.entity_id).filter(Boolean);
          // Fetch event_ids for each type
          let eventIds: string[] = [];
          // Budget items
          if (budgetItemIds.length > 0) {
            const { data: budgetItems } = await supabase
              .from('budget_items')
              .select('id, event_id')
              .in('id', budgetItemIds);
            (budgetItems || []).forEach(item => {
              changeLogEventMap[item.id] = item.event_id;
              eventIds.push(item.event_id);
            });
          }
          // Workflows
          if (workflowIds.length > 0) {
            const { data: workflows } = await supabase
              .from('workflows')
              .select('id, event_id')
              .in('id', workflowIds);
            (workflows || []).forEach(w => {
              changeLogEventMap[w.id] = w.event_id;
              eventIds.push(w.event_id);
            });
          }
          // Tasks
          if (taskIds.length > 0) {
            const { data: tasks } = await supabase
              .from('tasks')
              .select('id, event_id')
              .in('id', taskIds);
            (tasks || []).forEach(t => {
              changeLogEventMap[t.id] = t.event_id;
              eventIds.push(t.event_id);
            });
          }
          // Remove duplicates
          eventIds = Array.from(new Set(eventIds.filter(Boolean)));
          // Fetch event titles
          if (eventIds.length > 0) {
            const { data: events } = await supabase
              .from('events')
              .select('id, title')
              .in('id', eventIds);
            (events || []).forEach(event => {
              allEventTitles[event.id] = event.title;
            });
          }
        }

        if (changeLogs) {
          changeLogs.forEach(log => {
            let description = '';
            // Format date fields
            const dateFields = ['due_date', 'start_date', 'end_date'];
            if (dateFields.includes(log.field_name)) {
              const formatDate = (dateStr: string) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return dateStr;
                return `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}/${d.getFullYear()}`;
              };
              description = `${log.entity_type} ${log.field_name.replace('_', ' ')} changed from "${formatDate(log.old_value)}" to "${formatDate(log.new_value)}"`;
            
            } else if (log.field_name === "resource_assignments") {
              description = "Task linked resources updated";
            } else if (log.field_name === "title" || log.field_name === "status") {
              description = `${log.entity_type} ${String(log.field_name).replace("_", " ")} updated`;
            } else if (log.entity_type === 'workflow') {
              description = `${log.entity_type} ${log.field_name.replace('_', ' ')} changed`;
            } else if (log.field_name && log.old_value && log.new_value) {
              description = `${log.entity_type} ${log.field_name.replace('_', ' ')} changed from "${log.old_value}" to "${log.new_value}"`;
            } else if (log.action === 'created') {
              description = `${log.entity_type} created`;
            } else if (log.action === 'updated') {
              description = `${log.entity_type} ${log.field_name ? log.field_name.replace('_', ' ') : ''} updated`.trim();
            } else if (log.action === 'deleted') {
              description = `${log.entity_type} deleted`;
            } else {
              description = `${log.entity_type} ${log.action}`;
            }
            // Append event name if available
            const eventId = changeLogEventMap[log.entity_id];
            const eventName = eventId ? allEventTitles[eventId] : null;
            if (eventName && eventName !== 'Unnamed Event') {
              description += ` in ${eventName}`;
            }

            // Determine activity type based on entity_type
            let activityType: 'task' | 'analytics' | 'resource' = 'resource';
            if (log.entity_type === 'task') {
              activityType = 'task';
            } else if (log.entity_type === 'event_analytics') {
              activityType = 'analytics';
            }

            activitiesData.push({
              id: `log-${log.id}`,
              description,
              timestamp: log.created_at,
              type: activityType
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
      description: "Events you own (up to 10 loaded for this snapshot)",
      icon: Calendar,
      color: "primary"
    },
    {
      title: "Task Completion",
      value: loading ? "..." : `${analytics.taskCompletionRate}%`,
      description: "Your tasks marked completed ÷ all tasks you created",
      icon: CheckSquare,
      color: "secondary"
    },
    {
      title: "Resource Efficiency",
      value: loading ? "..." : `${analytics.resourceUtilization}%`,
      description: "Allocated ÷ capacity across resources on your events",
      icon: Activity,
      color: "accent"
    },
  ];

  const trialMsg = trialBannerText();

  return (
    <div className="space-y-6">
      {trialMsg ? (
        <Alert>
          <AlertDescription>{trialMsg}</AlertDescription>
        </Alert>
      ) : null}
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-1">
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard className="h-4 w-4" />
            All Events (Portfolio)
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => navigate("/dashboard/manage-event")}
          >
            <ClipboardList className="h-4 w-4" />
            My Event (Workspace)
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/workflow-dashboard'}>
            <Settings className="h-4 w-4 mr-2" />
            Workflow
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/themes'}>
            <Palette className="h-4 w-4 mr-2" />
            Browse Themes
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/project-management'}>
            <CheckSquare className="h-4 w-4 mr-2" />
            Manage Projects
          </Button>
          <Button variant="outline" onClick={() => navigate(createEventPath)} className="flex items-center gap-2 bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4" />
            Create event
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
                <p className="text-xs text-muted-foreground pt-1 leading-snug">
                  {stat.description}
                </p>
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
                    analytics.recentEvents.map((event: any, index) => {
                      const badge = getDashboardRecentEventStatusBadge(event);
                      return (
                      <div key={event.id ?? index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-success bg-opacity-10">
                        <div>
                          <p className="font-medium">{event.title || event.description || 'Unnamed Event'}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.description || 'Event'} •{' '}
                            {event.start_date
                              ? new Date(String(event.start_date).split('T')[0] + 'T00:00:00').toLocaleDateString()
                              : 'Date TBD'}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-1 text-xs rounded-full capitalize shrink-0",
                            badge.className,
                          )}
                        >
                          {badge.label}
                        </span>
                      </div>
                    );
                    })
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
                  type="button"
                  onClick={() => navigate("/dashboard/manage-event")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  + Change Request
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
                          <p className="text-sm font-medium">{
                            (() => {
                              const desc = activity.description.replace(/_/g, ' ');
                              return desc.charAt(0).toUpperCase() + desc.slice(1);
                            })()
                          }</p>
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