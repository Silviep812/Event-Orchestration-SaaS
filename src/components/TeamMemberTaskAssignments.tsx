import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, CheckCircle2, Clock, AlertCircle, UserPlus, Check, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  taskCategory: string | null;
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
  const [unassignedTasks, setUnassignedTasks] = useState<TaskAssignment[]>([]);
  const [unassignedTasksCount, setUnassignedTasksCount] = useState(0);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, string>>({});
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

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
      setAllUsers(allUsers);

      // Fetch all tasks with their categories
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, assigned_to, event_id, category')
        .order('due_date', { ascending: true });
      
      if (tasksError) throw tasksError;

      // Define valid resource type categories
      const resourceCategories = [
        'Venue',
        'Transportation', 
        'Service Vendor',
        'Vendor Service Rental/Buy',
        'Hospitality',
        'Supplier',
        'Entertainment',
        'Bookings'
      ];

      // Filter tasks to only show resource-type tasks
      const filteredTasks = tasks?.filter(task => 
        resourceCategories.includes(task.category) || 
        task.title === 'Lee Task Team'
      ) || [];

      // Fetch event titles separately
      const eventIds = [...new Set(filteredTasks?.map(t => t.event_id).filter(Boolean))];
      const { data: events } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);
      
      const eventMap = new Map(events?.map(e => [e.id, e.title]) || []);

      // Count unassigned tasks and store them
      const unassigned = filteredTasks?.filter(task => !task.assigned_to) || [];
      setUnassignedTasksCount(unassigned.length);
      
      // Convert unassigned tasks to TaskAssignment format
      const unassignedTasksList = unassigned.map((task: any) => ({
        id: task.id,
        user_id: '',
        userName: '',
        userEmail: '',
        taskId: task.id,
        taskTitle: task.title,
        taskStatus: task.status,
        taskPriority: task.priority,
        taskDueDate: task.due_date,
        eventTitle: task.event_id ? eventMap.get(task.event_id) || null : null,
        taskCategory: task.category
      }));
      setUnassignedTasks(unassignedTasksList);

      // Group tasks by user
      const userTasksMap = new Map<string, TaskAssignment[]>();
      
      filteredTasks?.forEach((task: any) => {
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
              eventTitle: task.event_id ? eventMap.get(task.event_id) || null : null,
              taskCategory: task.category
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

  const assignTask = async (taskId: string, userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the task's assigned_to field
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ assigned_to: userId })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // Create task assignment record
      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          user_id: userId,
          created_by: user.id
        });

      if (assignmentError) throw assignmentError;

      toast.success('Task assigned successfully');
      fetchTaskAssignments();
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('Failed to assign task');
    }
  };

  const reassignTask = async (taskId: string, newUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the task's assigned_to field
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ assigned_to: newUserId })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // Delete old assignment
      await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId);

      // Create new assignment
      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          user_id: newUserId,
          created_by: user.id
        });

      if (assignmentError) throw assignmentError;

      toast.success('Task reassigned successfully');
      fetchTaskAssignments();
    } catch (error) {
      console.error('Error reassigning task:', error);
      toast.error('Failed to reassign task');
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

      {/* Unassigned Tasks Section */}
      {unassignedTasksCount > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Unassigned Tasks ({unassignedTasksCount})</h3>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                {unassignedTasks.map((task) => (
                <div key={task.taskId} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{task.taskTitle}</p>
                          {task.taskCategory && (
                            <Badge className="bg-primary text-primary-foreground font-semibold">{task.taskCategory}</Badge>
                          )}
                        </div>
                        {task.eventTitle && (
                          <p className="text-xs text-muted-foreground mt-1">Event: {task.eventTitle}</p>
                        )}
                        {task.taskDueDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {format(new Date(task.taskDueDate), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {allUsers && allUsers.length > 0 && (
                          <>
                            <Popover open={openPopovers[task.taskId]} onOpenChange={(open) => setOpenPopovers({...openPopovers, [task.taskId]: open})}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-[180px] justify-between"
                                >
                                  {pendingAssignments[task.taskId] 
                                    ? allUsers.find((user) => user.id === pendingAssignments[task.taskId])?.name
                                    : "Select user..."}
                                  <UserPlus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0">
                                <Command>
                                  <CommandInput placeholder="Search user..." />
                                  <CommandEmpty>No user found.</CommandEmpty>
                                  <CommandGroup>
                                    {allUsers.map((user) => (
                                      <CommandItem
                                        key={user.id}
                                        value={user.name}
                                        onSelect={() => {
                                          setPendingAssignments({...pendingAssignments, [task.taskId]: user.id});
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            pendingAssignments[task.taskId] === user.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {user.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                if (pendingAssignments[task.taskId]) {
                                  assignTask(task.taskId, pendingAssignments[task.taskId]);
                                  setPendingAssignments({...pendingAssignments, [task.taskId]: undefined});
                                  setOpenPopovers({...openPopovers, [task.taskId]: false});
                                }
                              }}
                              disabled={!pendingAssignments[task.taskId]}
                              className="h-9 w-20"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setPendingAssignments({...pendingAssignments, [task.taskId]: undefined});
                                setOpenPopovers({...openPopovers, [task.taskId]: false});
                              }}
                              disabled={!pendingAssignments[task.taskId]}
                              className="h-9 w-20"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                    <div key={task.taskId} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{task.taskTitle}</p>
                            {task.taskCategory && (
                              <Badge className="bg-primary text-primary-foreground font-semibold">{task.taskCategory}</Badge>
                            )}
                            <Badge variant={task.taskStatus === 'completed' ? 'default' : 'outline'}>
                              {task.taskStatus}
                            </Badge>
                          </div>
                          {task.eventTitle && (
                            <p className="text-xs text-muted-foreground mt-1">Event: {task.eventTitle}</p>
                          )}
                          {task.taskDueDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {format(new Date(task.taskDueDate), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        {allUsers && allUsers.length > 0 && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Popover open={openPopovers[`reassign-${task.taskId}`]} onOpenChange={(open) => setOpenPopovers({...openPopovers, [`reassign-${task.taskId}`]: open})}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-[140px] justify-between"
                                >
                                  {pendingAssignments[`reassign-${task.taskId}`] 
                                    ? allUsers.find((user) => user.id === pendingAssignments[`reassign-${task.taskId}`])?.name
                                    : allUsers.find((user) => user.id === member.userId)?.name}
                                  <UserPlus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0">
                                <Command>
                                  <CommandInput placeholder="Search user..." />
                                  <CommandEmpty>No user found.</CommandEmpty>
                                  <CommandGroup>
                                    {allUsers.map((user) => (
                                      <CommandItem
                                        key={user.id}
                                        value={user.name}
                                        onSelect={() => {
                                          setPendingAssignments({...pendingAssignments, [`reassign-${task.taskId}`]: user.id});
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            (pendingAssignments[`reassign-${task.taskId}`] || member.userId) === user.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {user.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                if (pendingAssignments[`reassign-${task.taskId}`] && pendingAssignments[`reassign-${task.taskId}`] !== member.userId) {
                                  reassignTask(task.taskId, pendingAssignments[`reassign-${task.taskId}`]);
                                  setPendingAssignments({...pendingAssignments, [`reassign-${task.taskId}`]: undefined});
                                  setOpenPopovers({...openPopovers, [`reassign-${task.taskId}`]: false});
                                }
                              }}
                              disabled={!pendingAssignments[`reassign-${task.taskId}`] || pendingAssignments[`reassign-${task.taskId}`] === member.userId}
                              className="h-9 w-20"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Change
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setPendingAssignments({...pendingAssignments, [`reassign-${task.taskId}`]: undefined});
                                setOpenPopovers({...openPopovers, [`reassign-${task.taskId}`]: false});
                              }}
                              disabled={!pendingAssignments[`reassign-${task.taskId}`] || pendingAssignments[`reassign-${task.taskId}`] === member.userId}
                              className="h-9 w-20"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
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
