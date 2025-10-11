import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface TaskAssignment {
  id: string;
  user_id: string;
  userName: string;
  userEmail: string;
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  taskPriority: string;
  taskDueDate: string | null;
  eventTitle: string | null;
}

interface TeamMemberWithTasks {
  userId: string;
  userName: string;
  userEmail: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  tasks: TaskAssignment[];
}

export function TeamMemberTaskAssignments() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithTasks[]>([]);
  const [unassignedTasksCount, setUnassignedTasksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskAssignments();
  }, []);

  const fetchTaskAssignments = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const { data: usersResponse, error: usersError } = await supabase.functions.invoke('get-users-for-roles');
      
      if (usersError) throw usersError;
      
      const allUsers = usersResponse?.users || [];

      // Fetch all tasks with their assignments
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          assigned_to,
          event_id,
          events (
            title
          )
        `)
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;

      // Count unassigned tasks
      const unassigned = tasks?.filter(task => !task.assigned_to).length || 0;
      setUnassignedTasksCount(unassigned);

      // Group tasks by user
      const userTasksMap = new Map<string, TaskAssignment[]>();
      
      tasks?.forEach((task: any) => {
        if (task.assigned_to) {
          const user = allUsers.find((u: any) => u.id === task.assigned_to);
          if (user) {
            const assignment: TaskAssignment = {
              id: task.id,
              user_id: user.id,
              userName: user.name,
              userEmail: user.email,
              taskId: task.id,
              taskTitle: task.title,
              taskStatus: task.status,
              taskPriority: task.priority,
              taskDueDate: task.due_date,
              eventTitle: task.events?.title || null
            };

            if (!userTasksMap.has(user.id)) {
              userTasksMap.set(user.id, []);
            }
            userTasksMap.get(user.id)?.push(assignment);
          }
        }
      });

      // Create team member summaries
      const teamMembersData: TeamMemberWithTasks[] = Array.from(userTasksMap.entries()).map(([userId, tasks]) => {
        const completed = tasks.filter(t => t.taskStatus === 'completed').length;
        const pending = tasks.filter(t => t.taskStatus === 'pending' || t.taskStatus === 'in_progress').length;
        const overdue = tasks.filter(t => {
          if (!t.taskDueDate) return false;
          return new Date(t.taskDueDate) < new Date() && t.taskStatus !== 'completed';
        }).length;

        return {
          userId,
          userName: tasks[0].userName,
          userEmail: tasks[0].userEmail,
          totalTasks: tasks.length,
          completedTasks: completed,
          pendingTasks: pending,
          overdueTasks: overdue,
          tasks
        };
      });

      // Sort by total tasks (descending)
      teamMembersData.sort((a, b) => b.totalTasks - a.totalTasks);
      
      setTeamMembers(teamMembersData);
    } catch (error) {
      console.error('Error fetching task assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (member: TeamMemberWithTasks) => {
    if (member.overdueTasks > 0) return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (member.pendingTasks > 0) return <Clock className="h-4 w-4 text-warning" />;
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading task assignments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Members with Tasks</p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assigned Tasks</p>
                <p className="text-2xl font-bold">
                  {teamMembers.reduce((acc, member) => acc + member.totalTasks, 0)}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unassigned Tasks</p>
                <p className="text-2xl font-bold">{unassignedTasksCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Member Task Assignments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Team Member Task Assignments</h3>
        
        {teamMembers.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No task assignments yet. Assign tasks to team members in the Tasks tab.</p>
          </Card>
        ) : (
          teamMembers.map((member) => (
            <Card key={member.userId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {getStatusIcon(member)}
                      {member.userName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-primary/10">
                      {member.totalTasks} Total
                    </Badge>
                    {member.completedTasks > 0 && (
                      <Badge variant="outline" className="bg-success/10 text-success">
                        {member.completedTasks} Done
                      </Badge>
                    )}
                    {member.pendingTasks > 0 && (
                      <Badge variant="outline" className="bg-warning/10 text-warning">
                        {member.pendingTasks} Pending
                      </Badge>
                    )}
                    {member.overdueTasks > 0 && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive">
                        {member.overdueTasks} Overdue
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {member.tasks.map((task) => (
                    <div key={task.taskId} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{task.taskTitle}</p>
                          <Badge className={getPriorityColor(task.taskPriority)}>
                            {task.taskPriority}
                          </Badge>
                        </div>
                        {task.eventTitle && (
                          <p className="text-xs text-muted-foreground mt-1">Event: {task.eventTitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {task.taskDueDate && (
                          <p className="text-xs text-muted-foreground">
                            Due: {format(new Date(task.taskDueDate), 'MMM d, yyyy')}
                          </p>
                        )}
                        <Badge variant={task.taskStatus === 'completed' ? 'default' : 'outline'}>
                          {task.taskStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
