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
  assigned_user_id?: string;
  assigned_user_name?: string;
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
  assigned_user_id?: string;
  assigned_user_name?: string;
}

interface User {
  userid: string;
  user_name: string;
  contact_name: string;
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

// Mapping of collaborator types to people who can handle them
const collaboratorTypeMapping: Record<string, string[]> = {
  'Bookings': ['Person_1', 'Person_2'],
  'Venue': ['Person_3', 'Person_4'],
  'Vendor Service Rental/Buy': ['Person_5'],
  'Hospitality': ['Person_6'],
  'Service Vendor': ['Person_7'],
  'Transportation': ['Person_8'],
  'Entertainment': ['Person_1', 'Person_3'],
  'Suppliers': ['Person_2', 'Person_5']
};

export function TaskManager({ eventId, selectedEventFilter }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<AvailableTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [dueDateConflictDialog, setDueDateConflictDialog] = useState({
    isOpen: false,
    currentDate: "",
    suggestedDate: "",
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [dependentTasksConflictDialog, setDependentTasksConflictDialog] = useState({
    isOpen: false,
    currentDate: "",
    newDate: "",
    affectedTasks: [] as Array<{id: string, title: string, currentDueDate: string, newDueDate: string}>,
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_user_id: "",
    priority: "medium" as const,
    estimated_hours: "",
    due_date: "",
    selected_event_id: "",
    dependencies: [] as string[]
  });
  const [selectedCollaboratorTypes, setSelectedCollaboratorTypes] = useState<string[]>([]);
  const [dependencySearchTerm, setDependencySearchTerm] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();
  const { events, applyEventFilter } = useEventFilter();

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [eventId, user, selectedEventFilter, showArchived]);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('user_id, display_name');
      
      if (error) throw error;
      
      // Map profiles to User format
      const mappedUsers = (profilesData || []).map(profile => ({
        userid: profile.user_id,
        user_name: profile.display_name,
        contact_name: profile.display_name
      }));
      
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

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
      
      const tasksWithDependenciesAndAssignments = await Promise.all(
        (data || []).map(async (task) => {
          // Fetch dependencies
          const { data: deps } = await supabase
            .from('tasks_dependencies')
            .select('depends_on_task_id')
            .eq('task_id', task.id);
          
          // Fetch user assignment
          const { data: assignments } = await supabase
            .from('task_assignments')
            .select('user_id')
            .eq('task_id', task.id)
            .limit(1);
          
          let assigned_user_name: string | undefined;
          const assigned_user_id = assignments?.[0]?.user_id || undefined;
          
          if (assigned_user_id) {
            const { data: userData } = await supabase
              .from('User')
              .select('user_name')
              .eq('userid', assigned_user_id)
              .single();
            assigned_user_name = userData?.user_name || undefined;
          }
          
          return {
            ...task,
            dependencies: deps?.map(d => d.depends_on_task_id) || [],
            assigned_user_id,
            assigned_user_name
          };
        })
      );
      
      setTasks(tasksWithDependenciesAndAssignments);
      
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
      // Fetch all tasks for dependency selection, not filtered by event
      // This allows users to create dependencies across different events
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, assigned_to')
        .eq('archived', false);
      
      if (error) throw error;
      
      // Fetch assigned user names
      const tasksWithAssignments = await Promise.all(
        (data || []).map(async (task) => {
          let assigned_user_name: string | undefined;
          
          if (task.assigned_to) {
            const { data: userData } = await supabase
              .from('User')
              .select('user_name')
              .eq('userid', task.assigned_to)
              .single();
            assigned_user_name = userData?.user_name || undefined;
          }
          
          return {
            id: task.id,
            title: task.title,
            status: task.status,
            assigned_user_id: task.assigned_to,
            assigned_user_name
          };
        })
      );
      
      setAvailableTasks(tasksWithAssignments);
    } catch (error) {
      console.error('Error fetching available tasks:', error);
    }
  };

  const checkCircularDependency = async (taskId: string, dependencyIds: string[]): Promise<boolean> => {
    try {
      // Get all existing dependencies from the database
      const { data: allDependencies, error } = await supabase
        .from('tasks_dependencies')
        .select('task_id, depends_on_task_id');

      if (error) throw error;

      // Create a map of current dependencies (excluding the ones we're about to change)
      const dependencyMap: { [key: string]: string[] } = {};
      allDependencies?.forEach(dep => {
        if (dep.task_id !== taskId) { // Exclude current task's dependencies as we're updating them
          if (!dependencyMap[dep.task_id]) {
            dependencyMap[dep.task_id] = [];
          }
          dependencyMap[dep.task_id].push(dep.depends_on_task_id);
        }
      });

      // Add the new dependencies we want to create
      dependencyMap[taskId] = dependencyIds;

      // Check if any of the new dependencies would create a circular dependency
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const hasCycle = (currentTaskId: string): boolean => {
        if (recursionStack.has(currentTaskId)) {
          return true; // Found a cycle
        }
        if (visited.has(currentTaskId)) {
          return false; // Already processed this node
        }

        visited.add(currentTaskId);
        recursionStack.add(currentTaskId);

        const dependencies = dependencyMap[currentTaskId] || [];
        for (const depId of dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }

        recursionStack.delete(currentTaskId);
        return false;
      };

      // Check for cycles starting from any task
      for (const task of Object.keys(dependencyMap)) {
        visited.clear();
        recursionStack.clear();
        if (hasCycle(task)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking circular dependency:', error);
      return false;
    }
  };

  const saveDependencies = async (taskId: string, dependencyIds: string[]) => {
    try {
      // Check for circular dependencies
      const hasCircularDependency = await checkCircularDependency(taskId, dependencyIds);
      if (hasCircularDependency) {
        throw new Error('Circular dependency detected! This would create a dependency loop between tasks.');
      }

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

  const checkDueDateConflict = async (taskDueDate: string | undefined, dependencyIds: string[]): Promise<{hasConflict: boolean, suggestedDate?: string}> => {
    if (!taskDueDate || dependencyIds.length === 0) {
      return { hasConflict: false };
    }

    try {
      // Get the due dates of all dependency tasks
      const { data: dependencyTasks, error } = await supabase
        .from('tasks')
        .select('id, due_date')
        .in('id', dependencyIds);

      if (error) throw error;

      // Find the latest due date among dependencies
      let latestDependencyDate: Date | null = null;
      for (const depTask of dependencyTasks) {
        if (depTask.due_date) {
          const depDate = new Date(depTask.due_date);
          if (!latestDependencyDate || depDate > latestDependencyDate) {
            latestDependencyDate = depDate;
          }
        }
      }

      if (!latestDependencyDate) {
        return { hasConflict: false };
      }

      const currentTaskDate = new Date(taskDueDate);
      
      // If task due date is before or same as dependency due date, there's a conflict
      if (currentTaskDate <= latestDependencyDate) {
        // Suggest a date 1 day after the latest dependency
        const suggestedDate = new Date(latestDependencyDate);
        suggestedDate.setDate(suggestedDate.getDate() + 1);
        
        return {
          hasConflict: true,
          suggestedDate: suggestedDate.toISOString().split('T')[0]
        };
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('Error checking due date conflict:', error);
      return { hasConflict: false };
    }
  };

  const findDependentTasks = async (taskId: string): Promise<Task[]> => {
    try {
      // Find all task IDs that depend on this task
      const { data: dependentTaskIds, error: depsError } = await supabase
        .from('tasks_dependencies')
        .select('task_id')
        .eq('depends_on_task_id', taskId);

      if (depsError) throw depsError;

      if (!dependentTaskIds || dependentTaskIds.length === 0) {
        return [];
      }

      // Get the actual task details
      const { data: dependentTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('id', dependentTaskIds.map(dep => dep.task_id));

      if (tasksError) throw tasksError;

      return dependentTasks || [];
    } catch (error) {
      console.error('Error finding dependent tasks:', error);
      return [];
    }
  };

  const checkDependentTasksConflict = async (taskId: string, newDueDate: string): Promise<{hasConflict: boolean, affectedTasks?: Array<{id: string, title: string, currentDueDate: string, newDueDate: string}>}> => {
    try {
      const dependentTasks = await findDependentTasks(taskId);
      
      if (dependentTasks.length === 0) {
        return { hasConflict: false };
      }

      const newDate = new Date(newDueDate);
      const affectedTasks = [];

      for (const task of dependentTasks) {
        if (task.due_date) {
          const taskDueDate = new Date(task.due_date);
          // If dependent task has earlier due date than the new due date
          if (taskDueDate <= newDate) {
            const suggestedDate = new Date(newDate);
            suggestedDate.setDate(suggestedDate.getDate() + 1);
            
            affectedTasks.push({
              id: task.id,
              title: task.title,
              currentDueDate: task.due_date,
              newDueDate: suggestedDate.toISOString().split('T')[0]
            });
          }
        }
      }

      return {
        hasConflict: affectedTasks.length > 0,
        affectedTasks
      };
    } catch (error) {
      console.error('Error checking dependent tasks conflict:', error);
      return { hasConflict: false };
    }
  };

  const handleDependentTasksConflictConfirmation = (
    currentDate: string,
    newDate: string,
    affectedTasks: Array<{id: string, title: string, currentDueDate: string, newDueDate: string}>,
    onConfirm: () => void,
    onCancel: () => void
  ) => {
    setDependentTasksConflictDialog({
      isOpen: true,
      currentDate,
      newDate,
      affectedTasks,
      onConfirm: () => {
        setDependentTasksConflictDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setDependentTasksConflictDialog(prev => ({ ...prev, isOpen: false }));
        onCancel();
      }
    });
  };

  const handleDueDateConflictConfirmation = (
    currentDate: string,
    suggestedDate: string,
    onConfirm: () => void,
    onCancel: () => void
  ) => {
    setDueDateConflictDialog({
      isOpen: true,
      currentDate,
      suggestedDate,
      onConfirm: () => {
        setDueDateConflictDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setDueDateConflictDialog(prev => ({ ...prev, isOpen: false }));
        onCancel();
      }
    });
  };

  const createTask = async () => {
    if (!newTask.title.trim()) return;

    // Check for due date conflicts with dependencies
    if (newTask.due_date && newTask.dependencies.length > 0) {
      const conflict = await checkDueDateConflict(newTask.due_date, newTask.dependencies);
      if (conflict.hasConflict && conflict.suggestedDate) {
        handleDueDateConflictConfirmation(
          newTask.due_date,
          conflict.suggestedDate,
          () => {
            // User confirmed, update due date and continue
            setNewTask(prev => ({ ...prev, due_date: conflict.suggestedDate! }));
            executeCreateTask(conflict.suggestedDate);
          },
          () => {
            // User cancelled, do nothing
            return;
          }
        );
        return;
      }
    }

    executeCreateTask();
  };

  const executeCreateTask = async (overrideDueDate?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const taskData = {
        title: newTask.title,
        description: newTask.description || null,
        priority: newTask.priority as any,
        estimated_hours: newTask.estimated_hours ? parseFloat(newTask.estimated_hours) : null,
        due_date: overrideDueDate || newTask.due_date || null,
        event_id: eventId || newTask.selected_event_id || null,
        created_by: user.id
      };

      const { data: createdTask, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select('id')
        .single();

      if (error) throw error;

      // Save user assignment if provided
      if (newTask.assigned_user_id) {
        const { error: assignmentError } = await supabase
          .from('task_assignments')
          .insert({
            task_id: createdTask.id,
            user_id: newTask.assigned_user_id,
            created_by: user.id
          });

        if (assignmentError) throw assignmentError;
      }

      // Save dependencies if any
      if (newTask.dependencies.length > 0) {
        await saveDependencies(createdTask.id, newTask.dependencies);
      }

      toast({
        title: "Task created",
        description: "New task has been created successfully. You can create another task or close this dialog.",
      });

      // Keep Project/Event, Task Title, and Description filled for next task
      // Reset only the fields that should be cleared
      setNewTask({
        title: newTask.title,
        description: newTask.description,
        assigned_user_id: "",
        priority: "medium",
        estimated_hours: "",
        due_date: "",
        selected_event_id: newTask.selected_event_id,
        dependencies: []
      });
      setSelectedCollaboratorTypes([]);
      // Don't close dialog - let user close it or create another task
      fetchTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create task. Please try again.";
      const isCircularDependency = errorMessage.includes("Circular dependency detected");
      
      toast({
        title: "Error creating task",
        description: isCircularDependency ? errorMessage : "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateTaskAssignment = async (taskId: string, assignedUserId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, remove existing assignments
      await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId);

      // Then add new assignment if provided
      if (assignedUserId) {
        const { error } = await supabase
          .from('task_assignments')
          .insert({
            task_id: taskId,
            user_id: assignedUserId,
            created_by: user.id
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating task assignment:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Remove assigned_user_id and assigned_user_name from updates as they're handled separately
      const { assigned_user_id, assigned_user_name, ...taskUpdates } = updates;
      
      const { error } = await supabase
        .from('tasks')
        .update(taskUpdates)
        .eq('id', taskId);

      if (error) throw error;

      // Handle user assignment if provided
      if (assigned_user_id !== undefined) {
        await updateTaskAssignment(taskId, assigned_user_id);
      }

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
      throw error;
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    
    // Check for due date conflicts with dependencies first
    if (selectedTask.due_date && selectedDependencies.length > 0) {
      const conflict = await checkDueDateConflict(selectedTask.due_date, selectedDependencies);
      if (conflict.hasConflict && conflict.suggestedDate) {
        handleDueDateConflictConfirmation(
          selectedTask.due_date,
          conflict.suggestedDate,
          () => {
            // User confirmed, update due date and continue
            const updatedTask = { ...selectedTask, due_date: conflict.suggestedDate };
            setSelectedTask(updatedTask);
            executeUpdateTask(updatedTask, conflict.suggestedDate);
          },
          () => {
            // User cancelled, do nothing
            return;
          }
        );
        return;
      }
    }

    // Check if updating this task's due date affects dependent tasks
    if (selectedTask.due_date) {
      const dependentConflict = await checkDependentTasksConflict(selectedTask.id, selectedTask.due_date);
      if (dependentConflict.hasConflict && dependentConflict.affectedTasks) {
        handleDependentTasksConflictConfirmation(
          selectedTask.due_date,
          selectedTask.due_date,
          dependentConflict.affectedTasks,
          () => {
            // User confirmed, update task and dependent tasks
            executeUpdateTaskWithDependents(selectedTask, dependentConflict.affectedTasks);
          },
          () => {
            // User cancelled, do nothing
            return;
          }
        );
        return;
      }
    }

    executeUpdateTask(selectedTask);
  };

  const executeUpdateTaskWithDependents = async (
    taskToUpdate: Task, 
    affectedTasks: Array<{id: string, title: string, currentDueDate: string, newDueDate: string}>
  ) => {
    try {
      // Update the main task first
      await updateTask(taskToUpdate.id, {
        title: taskToUpdate.title,
        description: taskToUpdate.description,
        priority: taskToUpdate.priority,
        assigned_user_id: taskToUpdate.assigned_user_id,
        estimated_hours: taskToUpdate.estimated_hours,
        due_date: taskToUpdate.due_date,
      });

      // Update dependent tasks' due dates
      for (const affectedTask of affectedTasks) {
        await updateTask(affectedTask.id, {
          due_date: affectedTask.newDueDate
        });
      }

      // Save dependencies
      if (selectedDependencies.length !== (taskToUpdate.dependencies?.length || 0) || 
          !selectedDependencies.every(dep => taskToUpdate.dependencies?.includes(dep))) {
        await saveDependencies(taskToUpdate.id, selectedDependencies);
      }

      toast({
        title: "Tasks updated",
        description: `Updated main task and ${affectedTasks.length} dependent task${affectedTasks.length > 1 ? 's' : ''}.`,
      });

      setIsEditDialogOpen(false);
      setSelectedTask(null);
      setSelectedDependencies([]);
      fetchTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update tasks. Please try again.";
      const isCircularDependency = errorMessage.includes("Circular dependency detected");
      
      toast({
        title: "Error updating tasks",
        description: isCircularDependency ? errorMessage : "Failed to update tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const executeUpdateTask = async (taskToUpdate: Task, overrideDueDate?: string) => {
    try {
      await updateTask(taskToUpdate.id, {
        title: taskToUpdate.title,
        description: taskToUpdate.description,
        priority: taskToUpdate.priority,
        assigned_user_id: taskToUpdate.assigned_user_id,
        estimated_hours: taskToUpdate.estimated_hours,
        due_date: overrideDueDate || taskToUpdate.due_date,
      });

      // Save dependencies
      if (selectedDependencies.length !== (taskToUpdate.dependencies?.length || 0) || 
          !selectedDependencies.every(dep => taskToUpdate.dependencies?.includes(dep))) {
        await saveDependencies(taskToUpdate.id, selectedDependencies);
      }

      setIsEditDialogOpen(false);
      setSelectedTask(null);
      setSelectedDependencies([]);
      fetchTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update task. Please try again.";
      const isCircularDependency = errorMessage.includes("Circular dependency detected");
      
      toast({
        title: "Error updating task",
        description: isCircularDependency ? errorMessage : "Failed to update task. Please try again.",
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
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          if (open) {
            // Reset search term when opening
            setDependencySearchTerm("");
          } else {
            // Only reset form when closing
            setNewTask({
              title: "",
              description: "",
              assigned_user_id: "",
              priority: "medium" as const,
              estimated_hours: "",
              due_date: "",
              selected_event_id: "",
              dependencies: [] as string[]
            });
            setSelectedCollaboratorTypes([]);
            setDependencySearchTerm("");
          }
          setIsCreateDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
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
                    rows={4}
                  />
                </div>

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

                {/* Task Assignments selection */}
                <div className="space-y-2">
                  <Label>Task Assignments</Label>
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                    {[
                      'Bookings',
                      'Venue',
                      'Vendor Service Rental/Buy',
                      'Hospitality',
                      'Service Vendor',
                      'Transportation',
                      'Entertainment',
                      'Suppliers'
                    ].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`collab-${type}`}
                          checked={selectedCollaboratorTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCollaboratorTypes([...selectedCollaboratorTypes, type]);
                            } else {
                              setSelectedCollaboratorTypes(selectedCollaboratorTypes.filter(t => t !== type));
                            }
                            // Clear assignment when collaborator types change
                            setNewTask({ ...newTask, assigned_user_id: "" });
                          }}
                        />
                        <label htmlFor={`collab-${type}`} className="text-sm font-medium leading-none cursor-pointer">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedCollaboratorTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedCollaboratorTypes.map(type => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
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

                {/* Dependencies selection */}
                {availableTasks.length > 0 && (
                  <div className="space-y-2">
                    <Label>Task Dependencies (Select Multiple)</Label>
                    <p className="text-sm text-muted-foreground">Select all tasks that must be completed before this task can start:</p>
                    <Input
                      placeholder="Search by task assignments..."
                      value={dependencySearchTerm}
                      onChange={(e) => setDependencySearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                      {availableTasks
                        .filter(task => 
                          (task.assigned_user_name || '').toLowerCase().includes(dependencySearchTerm.toLowerCase())
                        )
                        .map((task) => (
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
                            <label htmlFor={`dep-${task.id}`} className="text-sm font-medium leading-none cursor-pointer">
                              {task.title}
                            </label>
                          </div>
                        ))}
                      {availableTasks.filter(task => 
                        (task.assigned_user_name || '').toLowerCase().includes(dependencySearchTerm.toLowerCase())
                      ).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No tasks found</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2 p-3 border border-primary/20 rounded-lg bg-primary/5">
                  <Label htmlFor="assigned-user" className="text-base font-semibold">Assign To</Label>
                  <Select 
                    value={newTask.assigned_user_id} 
                    onValueChange={(value) => {
                      const userId = value === "none" ? "" : value;
                      setNewTask({ ...newTask, assigned_user_id: userId });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a person" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">No assignment</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.userid} value={user.userid}>
                          {user.user_name || user.contact_name || 'Unnamed User'}
                        </SelectItem>
                      ))}
                      {users.length === 0 && (
                        <SelectItem value="none" disabled>No users available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
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

                {task.assigned_user_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>
                      {task.assigned_user_name}
                    </span>
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
            setDependencySearchTerm(""); // Reset search term
          } else {
            setDependencySearchTerm(""); // Reset search term when opening
          }
          setIsEditDialogOpen(open);
        }}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              {/* Left column */}
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
                    rows={4}
                  />
                </div>

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

              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-assigned-user">Assign To</Label>
                  <Select value={selectedTask.assigned_user_id || "none"} onValueChange={(value) => {
                    const userId = value === "none" ? undefined : value;
                    setSelectedTask({ ...selectedTask, assigned_user_id: userId });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a person" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">No assignment</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.userid} value={user.userid}>
                          {user.user_name || user.contact_name || 'Unnamed User'}
                        </SelectItem>
                      ))}
                      {users.length === 0 && (
                        <SelectItem value="none" disabled>No users available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

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

                {/* Dependencies selection for editing */}
                {availableTasks.filter(task => task.id !== selectedTask.id).length > 0 && (
                  <div className="space-y-2">
                    <Label>Task Dependencies (Select Multiple)</Label>
                    <p className="text-sm text-muted-foreground">Select all tasks that must be completed before this task can start:</p>
                    <Input
                      placeholder="Search by task assignments..."
                      value={dependencySearchTerm}
                      onChange={(e) => setDependencySearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                      {availableTasks
                        .filter(task => 
                          task.id !== selectedTask.id && 
                          (task.assigned_user_name || '').toLowerCase().includes(dependencySearchTerm.toLowerCase())
                        )
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
                          <label htmlFor={`edit-dep-${task.id}`} className="text-sm font-medium leading-none cursor-pointer">
                            {task.title}
                          </label>
                        </div>
                      ))}
                      {availableTasks.filter(task => 
                        task.id !== selectedTask.id && 
                        (task.assigned_user_name || '').toLowerCase().includes(dependencySearchTerm.toLowerCase())
                      ).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No tasks found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <Button onClick={handleUpdateTask} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Due Date Conflict Confirmation Dialog */}
      <Dialog open={dueDateConflictDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          dueDateConflictDialog.onCancel();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Due Date Conflict Detected</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This task depends on other tasks that have later due dates. The task's due date needs to be adjusted to avoid conflicts.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Current due date:</span>
                <span>{dueDateConflictDialog.currentDate ? format(new Date(dueDateConflictDialog.currentDate), 'MMM dd, yyyy') : 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Suggested due date:</span>
                <span className="text-blue-600 font-medium">{dueDateConflictDialog.suggestedDate ? format(new Date(dueDateConflictDialog.suggestedDate), 'MMM dd, yyyy') : 'Not set'}</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={dueDateConflictDialog.onCancel}>
                Cancel
              </Button>
              <Button onClick={dueDateConflictDialog.onConfirm}>
                Continue with Suggested Date
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dependent Tasks Conflict Dialog */}
      <Dialog 
        open={dependentTasksConflictDialog.isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            dependentTasksConflictDialog.onCancel();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dependent Tasks Update Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Updating this task's due date will affect {dependentTasksConflictDialog.affectedTasks.length} dependent task{dependentTasksConflictDialog.affectedTasks.length > 1 ? 's' : ''} that currently have earlier due dates. These tasks will be automatically updated to maintain proper dependency order.
            </p>
            
            <div className="space-y-3">
              <h4 className="font-medium">Tasks that will be updated:</h4>
              {dependentTasksConflictDialog.affectedTasks.map((task) => (
                <div key={task.id} className="p-3 border rounded-lg space-y-1">
                  <p className="font-medium">{task.title}</p>
                  <div className="text-sm text-muted-foreground">
                    <p>Current due date: {format(new Date(task.currentDueDate), 'PPP')}</p>
                    <p>New due date: {format(new Date(task.newDueDate), 'PPP')}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={dependentTasksConflictDialog.onCancel}>
                Cancel
              </Button>
              <Button onClick={dependentTasksConflictDialog.onConfirm}>
                Continue and Update All Tasks
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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