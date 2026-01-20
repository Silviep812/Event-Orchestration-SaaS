import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEventFilter } from "@/hooks/useEventFilter";
import { 
  TrendingUp, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Target,
  BarChart3,
  Users,
  Filter,
  Download,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  XCircle
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  event_id: string;
  assigned_user_id?: string | null;
  assigned_user_name?: string | null;
}


interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  onHoldTasks: number;
  totalHours: number;
  completedHours: number;
  averageCompletion: number;
  onTimeCompletion: number;
}

export default function TrackProgress() {
  const { toast } = useToast();
  const { selectedEventFilter, events, eventsLoading } = useEventFilter();
  
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    inProgressTasks: 0,
    onHoldTasks: 0,
    totalHours: 0,
    completedHours: 0,
    averageCompletion: 0,
    onTimeCompletion: 0
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (selectedEventFilter !== "all") {
        query = query.eq('event_id', selectedEventFilter);
      }

      const { data: tasksData, error } = await query;
      
      if (error) throw error;

      // Fetch assigned users for each task
      const tasksWithUsers = await Promise.all(
        (tasksData || []).map(async (task) => {
          // Get assigned user from task's assigned_to field
          let assigned_user_name: string | null = null;
          const assigned_user_id = (task as any).assigned_to || null;
          
          if (assigned_user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', assigned_user_id)
              .maybeSingle();
            assigned_user_name = profileData?.display_name || null;
          }

          return {
            ...task,
            assigned_user_id,
            assigned_user_name
          };
        })
      );
      
      setTasks(tasksWithUsers);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProjectStats = (taskList: Task[]) => {
    const completed = taskList.filter(t => t.status === 'completed').length;
    const overdue = taskList.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'on_hold'
    ).length;
    const inProgress = taskList.filter(t => t.status === 'in_progress').length;
    const onHold = taskList.filter(t => t.status === 'on_hold').length;
    const totalHours = taskList.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    const completedHours = taskList.reduce((sum, t) => sum + (t.actual_hours || 0), 0);
    
    // Calculate progress based on status
    const getTaskProgress = (task: Task) => {
      switch (task.status) {
        case 'completed': return 100;
        case 'in_progress': return 50;
        case 'on_hold': return 25;
        case 'not_started': return 0;
        case 'cancelled': return 0;
        default: return 0;
      }
    };
    
    const avgProgress = taskList.length > 0 
      ? taskList.reduce((sum, t) => sum + getTaskProgress(t), 0) / taskList.length 
      : 0;
    
    const onTimeComplete = taskList.filter(t => 
      t.status === 'completed' && 
      (!t.due_date || new Date(t.due_date) >= new Date())
    ).length;

    setProjectStats({
      totalTasks: taskList.length,
      completedTasks: completed,
      overdueTasks: overdue,
      inProgressTasks: inProgress,
      onHoldTasks: onHold,
      totalHours,
      completedHours,
      averageCompletion: Math.round(avgProgress),
      onTimeCompletion: completed > 0 ? Math.round((onTimeComplete / completed) * 100) : 0
    });
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedEventFilter]);

  useEffect(() => {
    calculateProjectStats(tasks);
  }, [tasks]);

  // Old mock data for reference
  //  const mockTasks: Task[] = [
  //     {
  //       id: "1",
  //       title: "Venue Contract Finalization",
  //       description: "Complete venue booking and contract signing",
  //       status: "completed",
  //       priority: "high",
  //       assignee: "1",
  //       assigneeName: "John Doe",
  //       dueDate: "2024-08-10",
  //       progress: 100,
  //       estimatedHours: 8,
  //       actualHours: 6,
  //       category: "Venue"
  //     },
  //     {
  //       id: "2",
  //       title: "Catering Menu Selection",
  //       description: "Choose final menu and finalize catering details",
  //       status: "in_progress",
  //       priority: "high",
  //       assignee: "2",
  //       assigneeName: "Sarah Wilson",
  //       dueDate: "2024-08-20",
  //       progress: 75,
  //       estimatedHours: 12,
  //       actualHours: 9,
  //       category: "Catering"
  //     },
  //     {
  //       id: "3",
  //       title: "Audio/Visual Setup",
  //       description: "Coordinate AV equipment and technical setup",
  //       status: "not_started",
  //       priority: "medium",
  //       assignee: "3",
  //       assigneeName: "Mike Johnson",
  //       dueDate: "2024-08-25",
  //       progress: 0,
  //       estimatedHours: 16,
  //       actualHours: 0,
  //       category: "Technical"
  //     },
  //     {
  //       id: "4",
  //       title: "Guest List Management",
  //       description: "Finalize guest list and send invitations",
  //       status: "overdue",
  //       priority: "urgent",
  //       assignee: "2",
  //       assigneeName: "Sarah Wilson",
  //       dueDate: "2024-08-12",
  //       progress: 40,
  //       estimatedHours: 6,
  //       actualHours: 4,
  //       category: "Guests"
  //     },
  //     {
  //       id: "5",
  //       title: "Decorations & Themes",
  //       description: "Setup event decorations and theme elements",
  //       status: "blocked",
  //       priority: "medium",
  //       assignee: "1",
  //       assigneeName: "John Doe",
  //       dueDate: "2024-08-22",
  //       progress: 25,
  //       estimatedHours: 20,
  //       actualHours: 5,
  //       category: "Decorations"
  //     }
  //  ]

  //   const mockMilestones: Milestone[] = [
  //     {
  //       id: "1",
  //       title: "Venue & Catering Secured",
  //       description: "All major venue and catering arrangements finalized",
  //       targetDate: "2024-08-20",
  //       status: "on_track",
  //       progress: 85,
  //       tasks: []
  //     },
  //     {
  //       id: "2",
  //       title: "Guest Management Complete",
  //       description: "All guest-related tasks completed",
  //       targetDate: "2024-08-25",
  //       status: "at_risk",
  //       progress: 40,
  //       tasks: []
  //     }
  //   ];
  //   setMilestones(mockMilestones);
  // }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'not_started': return 'bg-gray-400';
      case 'cancelled': return 'bg-red-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'on_track': return 'bg-green-500';
      case 'at_risk': return 'bg-yellow-500';
      case 'upcoming': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return PlayCircle;
      case 'not_started': return Clock;
      case 'cancelled': return XCircle;
      case 'on_hold': return PauseCircle;
      default: return Clock;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (selectedFilter === 'all') return true;
    return task.status === selectedFilter;
  });

  const handleRefresh = () => {
    fetchTasks();
    toast({
      title: "Progress Updated",
      description: "Latest progress data has been refreshed.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Track Progress
          </h1>
          <p className="text-muted-foreground">
            Monitor project progress and team performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.totalTasks}</div>
            <Progress value={(projectStats.completedTasks / projectStats.totalTasks) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {projectStats.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.averageCompletion}%</div>
            <Progress value={projectStats.averageCompletion} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Average completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Tracked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.completedHours}h</div>
            <Progress value={(projectStats.completedHours / projectStats.totalHours) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              of {projectStats.totalHours}h estimated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{projectStats.overdueTasks}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Requires immediate attention
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            
            <Badge variant="outline">
              {filteredTasks.length} tasks
            </Badge>
          </div>

          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const StatusIcon = getStatusIcon(task.status);
              return (
                <Card key={task.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-5 h-5 text-white p-1 rounded-full ${getStatusColor(task.status)}`} />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{task.title}</h3>
                            <Badge variant={getPriorityColor(task.priority) as any}>
                              {task.priority}
                            </Badge>
                            {task.assigned_user_name && (
                              <Badge variant="outline">
                                {task.assigned_user_name}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {task.description || 'No description provided'}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {task.due_date && (
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </div>
                            )}
                            {task.assigned_user_name && (
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {task.assigned_user_name}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {task.actual_hours || 0}h / {task.estimated_hours || 0}h
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>
                                {task.status === 'completed' ? 100 : 
                                 task.status === 'in_progress' ? 50 : 
                                 task.status === 'on_hold' ? 25 : 0}%
                              </span>
                            </div>
                            <Progress value={
                              task.status === 'completed' ? 100 : 
                              task.status === 'in_progress' ? 50 : 
                              task.status === 'on_hold' ? 25 : 0
                            } />
                          </div>
                        </div>
                      </div>
                      
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {task.assigned_user_name ? 
                            task.assigned_user_name.split(' ').map(w => w[0].toUpperCase()).join('').slice(0, 2) : 
                            'UN'
                          }
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>


        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Task Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Completed', count: projectStats.completedTasks, color: 'bg-green-500' },
                    { label: 'In Progress', count: projectStats.inProgressTasks, color: 'bg-blue-500' },
                    { label: 'On Hold', count: projectStats.onHoldTasks, color: 'bg-yellow-500' },
                    { label: 'Overdue', count: projectStats.overdueTasks, color: 'bg-orange-500' },
                    { label: 'Not Started', count: projectStats.totalTasks - projectStats.completedTasks - projectStats.inProgressTasks - projectStats.onHoldTasks - projectStats.overdueTasks, color: 'bg-gray-400' }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>On-time Completion Rate</span>
                      <span>{projectStats.onTimeCompletion}%</span>
                    </div>
                    <Progress value={projectStats.onTimeCompletion} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Time Efficiency</span>
                      <span>{Math.round((projectStats.completedHours / projectStats.totalHours) * 100)}%</span>
                    </div>
                    <Progress value={(projectStats.completedHours / projectStats.totalHours) * 100} />
                  </div>
                  
                  <div className="pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Estimated Hours:</span>
                      <span className="font-medium">{projectStats.totalHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours Completed:</span>
                      <span className="font-medium">{projectStats.completedHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Task Progress:</span>
                      <span className="font-medium">{projectStats.averageCompletion}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}