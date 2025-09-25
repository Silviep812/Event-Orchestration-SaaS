import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEventFilter } from "@/hooks/useEventFilter";
import { CheckCircle2, Clock, AlertCircle, Plus, Calendar, User, Archive, ArchiveRestore, Eye, EyeOff, Link } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_role?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  event_id?: string;
  dependencies?: string[]; // Array of task IDs this task depends on
}

interface AvailableTask {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
}

interface TaskManagerProps {
  eventId?: string;
  selectedEventFilter?: string;
}

const statusColors = {
  not_started: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800"
};

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

const statusIcons = {
  not_started: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle2,
  on_hold: AlertCircle,
  cancelled: AlertCircle
};

export function TaskManager({ eventId, selectedEventFilter }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<AvailableTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_role: "",
    priority: "medium" as const,
    estimated_hours: "",
    due_date: "",
    selected_event_id: "",
    dependencies: [] as string[]
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { events, applyEventFilter } = useEventFilter();

  useEffect(() => {
    fetchTasks();
  }, [eventId, user, selectedEventFilter, showArchived]);

  const fetchTasks = async () => {
    try {
      let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (eventId) {
        query = query.eq('event_id', eventId);
      } else if (selectedEventFilter && selectedEventFilter !== "all") {
        query = query.eq('event_id', selectedEventFilter);
      }
      
      // Filter by archived status
      query = query.eq('archived', showArchived);
      
      const { data, error } = await query;
      if (error) throw error;
      
      const tasksWithDependencies = await Promise.all(
        (data || []).map(async (task) => {
          const { data: deps } = await supabase
            .from('tasks_dependencies')
            .select('depends_on_task_id')
            .eq('task_id', task.id);
          
          return {
            ...task,
            dependencies: deps?.map(d => d.depends_on_task_id) || []
          };
        })
      );
      
      setTasks(tasksWithDependencies);
      
      // Fetch available tasks for dependency selection
      await fetchAvailableTasks();
    } catch (error) {
      toast({
        title: "Error fetching tasks",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTasks = async () => {
    try {
      let query = supabase.from('tasks').select('id, title, status').eq('archived', false);
      
      if (eventId) {
        query = query.eq('event_id', eventId);
      } else if (selectedEventFilter && selectedEventFilter !== "all") {
        query = query.eq('event_id', selectedEventFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      setAvailableTasks(data || []);
    } catch (error) {
      console.error('Error fetching available tasks:', error);
    }
  };

  const saveDependencies = async (taskId: string, dependencyIds: string[]) => {
    try {
      // First, remove existing dependencies
      await supabase
        .from('tasks_dependencies')
        .delete()
        .eq('task_id', taskId);

      // Then add new dependencies
      if (dependencyIds.length > 0) {
        const dependencies = dependencyIds.map(depId => ({
          task_id: taskId,
          depends_on_task_id: depId
        }));

        const { error } = await supabase
          .from('tasks_dependencies')
          .insert(dependencies);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving dependencies:', error);
      throw error;
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const taskData = {
        title: newTask.title,
        description: newTask.description || null,
        assigned_venue_role: newTask.assigned_role || null,
        priority: newTask.priority as any,
        estimated_hours: newTask.estimated_hours ? parseFloat(newTask.estimated_hours) : null,
        due_date: newTask.due_date || null,
        event_id: eventId || newTask.selected_event_id || null,
        created_by: user.id
      };

      const { data: createdTask, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select('id')
        .single();

      if (error) throw error;

      // Save dependencies if any
      if (newTask.dependencies.length > 0) {
        await saveDependencies(createdTask.id, newTask.dependencies);
      }

      toast({
        title: "Task created",
        description: "New task has been created successfully.",
      });

      setNewTask({
        title: "",
        description: "",
        assigned_role: "",
        priority: "medium",
        estimated_hours: "",
        due_date: "",
        selected_event_id: "",
        dependencies: []
      });
      setIsCreateDialogOpen(false);
      fetchTasks();
    } catch (error) {
      toast({
        title: "Error creating task",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));

      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error updating task",
        description: "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    
    try {
      await updateTask(selectedTask.id, {
        title: selectedTask.title,
        description: selectedTask.description,
        priority: selectedTask.priority,
        assigned_role: selectedTask.assigned_role,
        estimated_hours: selectedTask.estimated_hours,
        due_date: selectedTask.due_date,
      });

      // Save dependencies
      if (selectedDependencies.length !== (selectedTask.dependencies?.length || 0) || 
          !selectedDependencies.every(dep => selectedTask.dependencies?.includes(dep))) {
        await saveDependencies(selectedTask.id, selectedDependencies);
      }

      setIsEditDialogOpen(false);
      setSelectedTask(null);
      setSelectedDependencies([]);
      fetchTasks();
    } catch (error) {
      toast({
        title: "Error updating task",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const archiveTask = async (taskId: string, archived: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ archived })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: archived ? "Task archived" : "Task restored",
        description: archived ? "Task has been archived." : "Task has been restored.",
      });

      fetchTasks();
    } catch (error) {
      toast({
        title: "Error updating task",
        description: "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Task Management</h2>
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2"
          >
            {showArchived ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!eventId && events.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="event">Select Project/Event</Label>
                  <Select value={newTask.selected_event_id} onValueChange={(value) => setNewTask({ ...newTask, selected_event_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project/event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} {event.start_date && `(${format(new Date(event.start_date), 'MMM d, yyyy')})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Assigned Role</Label>
                  <Select value={newTask.assigned_role} onValueChange={(value) => setNewTask({ ...newTask, assigned_role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event_manager">Event Manager</SelectItem>
                      <SelectItem value="vendor_coordinator">Vendor Coordinator</SelectItem>
                      <SelectItem value="budget_manager">Budget Manager</SelectItem>
                      <SelectItem value="task_coordinator">Task Coordinator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Estimated Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    placeholder="0.0"
                    value={newTask.estimated_hours}
                    onChange={(e) => setNewTask({ ...newTask, estimated_hours: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Dependencies selection */}
              {availableTasks.length > 0 && (
                <div className="space-y-2">
                  <Label>Task Dependencies</Label>
                  <p className="text-sm text-muted-foreground">Select tasks that must be completed before this task can start:</p>
                  <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-2">
                    {availableTasks.map((task) => (
                      <div key={task.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dep-${task.id}`}
                          checked={newTask.dependencies.includes(task.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewTask({
                                ...newTask,
                                dependencies: [...newTask.dependencies, task.id]
                              });
                            } else {
                              setNewTask({
                                ...newTask,
                                dependencies: newTask.dependencies.filter(id => id !== task.id)
                              });
                            }
                          }}
                        />
                        <label htmlFor={`dep-${task.id}`} className="text-sm font-medium leading-none">
                          {task.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={createTask} className="w-full">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => {
          const StatusIcon = statusIcons[task.status];
          return (
            <Card 
              key={task.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedTask(task);
                setSelectedDependencies(task.dependencies || []);
                setIsEditDialogOpen(true);
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <Badge className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                )}

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <StatusIcon className="h-4 w-4" />
                  <Select value={task.status} onValueChange={(value: any) => updateTask(task.id, { status: value })}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {task.assigned_role && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="capitalize">{task.assigned_role.replace('_', ' ')}</span>
                  </div>
                )}

                {task.estimated_hours && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{task.estimated_hours}h estimated</span>
                  </div>
                )}

                  {task.due_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}

                  {task.dependencies && task.dependencies.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link className="h-3 w-3" />
                      <span>Depends on {task.dependencies.length} task{task.dependencies.length > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => archiveTask(task.id, !task.archived)}
                      className="flex items-center gap-1"
                    >
                      {task.archived ? (
                        <>
                          <ArchiveRestore className="h-3 w-3" />
                          Restore
                        </>
                      ) : (
                        <>
                          <Archive className="h-3 w-3" />
                          Archive
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Task Dialog */}
      {selectedTask && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setSelectedDependencies([]);
          }
          setIsEditDialogOpen(open);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Task Title</Label>
                <Input
                  id="edit-title"
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedTask.description || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={selectedTask.priority}
                    onValueChange={(value: any) => setSelectedTask({ ...selectedTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Assigned Role</Label>
                  <Select
                    value={selectedTask.assigned_role || ''}
                    onValueChange={(value) => setSelectedTask({ ...selectedTask, assigned_role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event_manager">Event Manager</SelectItem>
                      <SelectItem value="vendor_coordinator">Vendor Coordinator</SelectItem>
                      <SelectItem value="budget_manager">Budget Manager</SelectItem>
                      <SelectItem value="task_coordinator">Task Coordinator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-hours">Estimated Hours</Label>
                  <Input
                    id="edit-hours"
                    type="number"
                    step="0.5"
                    value={selectedTask.estimated_hours || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-due_date">Due Date</Label>
                  <Input
                    id="edit-due_date"
                    type="datetime-local"
                    value={selectedTask.due_date ? format(new Date(selectedTask.due_date), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, due_date: e.target.value || undefined })}
                  />
                </div>
              </div>

              {/* Dependencies selection for editing */}
              {availableTasks.filter(task => task.id !== selectedTask.id).length > 0 && (
                <div className="space-y-2">
                  <Label>Task Dependencies</Label>
                  <p className="text-sm text-muted-foreground">Select tasks that must be completed before this task can start:</p>
                  <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-2">
                    {availableTasks
                      .filter(task => task.id !== selectedTask.id)
                      .map((task) => (
                      <div key={task.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-dep-${task.id}`}
                          checked={selectedDependencies.includes(task.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDependencies([...selectedDependencies, task.id]);
                            } else {
                              setSelectedDependencies(selectedDependencies.filter(id => id !== task.id));
                            }
                          }}
                        />
                        <label htmlFor={`edit-dep-${task.id}`} className="text-sm font-medium leading-none">
                          {task.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={handleUpdateTask} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-4">Create your first task to get started.</p>
        </div>
      )}
    </div>
  );
}