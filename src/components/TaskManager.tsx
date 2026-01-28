import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { CheckCircle2, Clock, AlertCircle, Plus, Calendar, User, Archive, ArchiveRestore, Eye, EyeOff, Link, Save, X } from "lucide-react";
import { format } from "date-fns";
import { createTaskSchema } from "@/lib/validation/taskValidation";
import { 
  ResourceAssignment, 
  ResourceAssignmentRow, 
  ResourceAssignmentBadge,
  RESOURCE_CATEGORIES,
  getEmptyResourceAssignments,
  getSelectedCategories
} from "@/components/ResourceAssignmentRow";

interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  assigned_role?: string;
  assigned_coordinator_name?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  event_id?: string;
  dependencies?: string[]; // Array of task IDs this task depends on
  category?: string; // Task category based on collaborator type (Bookings, Venue, etc.)
  resource_assignments?: Record<string, ResourceAssignment>; // Enhanced resource tracking
}

interface AvailableTask {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  assigned_user_id?: string;
  assigned_user_name?: string;
  category?: string;
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


export function TaskManager({ eventId, selectedEventFilter }: TaskManagerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<AvailableTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [shouldPreserveForm, setShouldPreserveForm] = useState(false);
  const [showDependencyDialog, setShowDependencyDialog] = useState(false);
  const [taskForDependencies, setTaskForDependencies] = useState<{ id: string; title: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [dueDateConflictDialog, setDueDateConflictDialog] = useState({
    isOpen: false,
    currentDate: "",
    suggestedDate: "",
    onConfirm: () => { },
    onCancel: () => { }
  });
  const [dependentTasksConflictDialog, setDependentTasksConflictDialog] = useState({
    isOpen: false,
    currentDate: "",
    newDate: "",
    affectedTasks: [] as Array<{ id: string, title: string, currentDueDate: string, newDueDate: string }>,
    onConfirm: () => { },
    onCancel: () => { }
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    estimated_hours: "",
    due_date: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    selected_event_id: "",
    dependencies: [] as string[],
    assigned_role: ""
  });
  const [selectedCollaboratorTypes, setSelectedCollaboratorTypes] = useState<string[]>([]);
  const [resourceAssignments, setResourceAssignments] = useState<Record<string, ResourceAssignment>>(getEmptyResourceAssignments());
  const [editResourceAssignments, setEditResourceAssignments] = useState<Record<string, ResourceAssignment>>(getEmptyResourceAssignments());
  const [dependencySearchTerm, setDependencySearchTerm] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [clearFormAfterSave, setClearFormAfterSave] = useState(false);
  const [cardCollaboratorInput, setCardCollaboratorInput] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { events, applyEventFilter } = useEventFilter();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      await fetchTasks();
      if (!isMounted) return;

      // Always fetch all users (not filtered by event)
      await fetchUsers();

      // Check URL parameters for auto-opening modal
      const openModal = searchParams.get('openModal');
      const urlEventId = searchParams.get('eventId');

      if (openModal === 'true' && isMounted) {
        setIsCreateDialogOpen(true);

        // Auto-select the event if eventId is provided in URL or props
        const targetEventId = urlEventId || eventId;
        if (targetEventId) {
          setNewTask(prev => ({ ...prev, selected_event_id: targetEventId }));
        }

        // Remove the openModal parameter from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('openModal');
        setSearchParams(newSearchParams, { replace: true });
      }

      if (isMounted) setLoading(false);
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [eventId, selectedEventFilter, showArchived]);

  const fetchUsers = async () => {
    try {
      // First, get all valid profiles (only users that actually exist)
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .not('display_name', 'eq', 'IDA Event Partners');

      if (profilesError) throw profilesError;

      // Get unique user IDs from profiles
      const validUserIds = new Set((allProfiles || []).map(p => p.user_id));

      // Fetch users who have roles assigned AND exist in profiles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id');

      if (rolesError) throw rolesError;

      let mappedUsers: User[] = [];

      if (userRoles && userRoles.length > 0) {
        // Get unique user IDs that have roles AND exist in profiles
        const uniqueUserIds = [...new Set(
          userRoles
            .map(role => role.user_id)
            .filter(userId => validUserIds.has(userId))
        )];

        if (uniqueUserIds.length > 0) {
          const { data: profilesData, error: profilesError2 } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', uniqueUserIds);

          if (profilesError2) throw profilesError2;

          mappedUsers = (profilesData || [])
            .map(profile => ({
              userid: profile.user_id,
              user_name: profile.display_name || 'Unknown User',
              contact_name: profile.display_name || 'Unknown User'
            }));
        }
      }

      // Also include current user if they have a profile (even without roles)
      const { data: { user } } = await supabase.auth.getUser();
      if (user && validUserIds.has(user.id)) {
        const currentUserProfile = allProfiles?.find(p => p.user_id === user.id);
        if (currentUserProfile && !mappedUsers.find(u => u.userid === user.id)) {
          mappedUsers.push({
            userid: user.id,
            user_name: currentUserProfile.display_name || 'You',
            contact_name: currentUserProfile.display_name || 'You'
          });
        }
      }

      // Handle duplicate display names by appending identifier
      const displayNameCounts = new Map<string, number>();
      mappedUsers.forEach(user => {
        const count = displayNameCounts.get(user.user_name) || 0;
        displayNameCounts.set(user.user_name, count + 1);
      });

      const displayNameIndices = new Map<string, number>();
      const uniqueUsers = mappedUsers.map(user => {
        if (displayNameCounts.get(user.user_name)! > 1) {
          const index = (displayNameIndices.get(user.user_name) || 0) + 1;
          displayNameIndices.set(user.user_name, index);
          return {
            ...user,
            user_name: `${user.user_name} (${index})`,
            contact_name: `${user.contact_name} (${index})`
          };
        }
        return user;
      });

      setUsers(uniqueUsers);
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

          // Fetch user assignment from assigned_to field directly
          let assigned_user_name: string | undefined;
          const assigned_user_id = task.assigned_to || undefined;

          if (assigned_user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', assigned_user_id)
              .single();
            assigned_user_name = profileData?.display_name || undefined;
          }

          // Get role assignment from task columns
          const roleAssignment = task.assigned_venue_role ||
            task.assigned_supplier_vendor_role ||
            task.assigned_service_vendor_role ||
            task.assined_vendor_role;

          // Parse resource_assignments from JSON
          let parsedResourceAssignments: Record<string, ResourceAssignment> | undefined;
          if (task.resource_assignments && typeof task.resource_assignments === 'object' && !Array.isArray(task.resource_assignments)) {
            parsedResourceAssignments = task.resource_assignments as unknown as Record<string, ResourceAssignment>;
          }

          return {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            estimated_hours: task.estimated_hours,
            actual_hours: task.actual_hours,
            due_date: task.due_date,
            start_date: task.start_date,
            end_date: task.end_date,
            start_time: task.start_time,
            end_time: task.end_time,
            archived: task.archived,
            created_at: task.created_at,
            updated_at: task.updated_at,
            event_id: task.event_id,
            category: task.category,
            dependencies: deps?.map(d => d.depends_on_task_id) || [],
            assigned_to: task.assigned_to,
            assigned_user_id,
            assigned_user_name,
            assigned_role: roleAssignment,
            assigned_coordinator_name: task.assigned_coordinator_name,
            resource_assignments: parsedResourceAssignments
          } as Task;
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
    }
  };

  const fetchAvailableTasks = async () => {
    try {
      // Fetch all tasks for dependency selection, not filtered by event
      // This allows users to create dependencies across different events
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, category, assigned_to')
        .eq('archived', false);

      if (error) throw error;

      // Fetch assigned user names
      const tasksWithAssignments = await Promise.all(
        (data || []).map(async (task) => {
          let assigned_user_name: string | undefined;
          let assigned_user_id: string | undefined;

          // Fetch user assignment from assigned_to field directly
          assigned_user_id = task.assigned_to || undefined;

          if (assigned_user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', assigned_user_id)
              .single();
            assigned_user_name = profileData?.display_name || undefined;
          }

          return {
            id: task.id,
            title: task.title,
            status: task.status,
            assigned_user_id,
            assigned_user_name,
            category: task.category
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

      // First, remove existing dependencies (check for errors)
      const { error: deleteError } = await supabase
        .from('tasks_dependencies')
        .delete()
        .eq('task_id', taskId);

      if (deleteError) {
        console.error('Error deleting existing dependencies:', deleteError);
        throw new Error(`Failed to remove existing dependencies: ${deleteError.message}`);
      }

      // Then add new dependencies
      if (dependencyIds.length > 0) {
        const dependencies = dependencyIds.map(depId => ({
          task_id: taskId,
          depends_on_task_id: depId
        }));

        const { error: insertError } = await supabase
          .from('tasks_dependencies')
          .insert(dependencies);

        if (insertError) {
          console.error('Error inserting dependencies:', insertError);
          // Provide more specific error message
          if (insertError.code === '42501' || insertError.message.includes('permission') || insertError.message.includes('policy')) {
            throw new Error('Permission denied: You can only add dependencies to tasks you created. Please check task ownership.');
          } else if (insertError.code === '23503' || insertError.message.includes('foreign key')) {
            throw new Error('Invalid task dependency: One or more selected tasks no longer exist.');
          } else if (insertError.code === '23505' || insertError.message.includes('unique')) {
            throw new Error('Duplicate dependency: This dependency relationship already exists.');
          } else {
            throw new Error(`Failed to save dependencies: ${insertError.message}`);
          }
        }
      }
    } catch (error: any) {
      console.error('Error saving dependencies:', error);
      // Re-throw with a user-friendly message if it's not already an Error object
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Failed to save dependencies: ${error?.message || 'Unknown error'}`);
      }
    }
  };

  const checkDueDateConflict = async (taskDueDate: string | undefined, dependencyIds: string[]): Promise<{ hasConflict: boolean, suggestedDate?: string }> => {
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

  const findDependentTasks = async (taskId: string): Promise<Array<{ id: string; title: string; due_date?: string }>> => {
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
        .select('id, title, due_date')
        .in('id', dependentTaskIds.map(dep => dep.task_id));

      if (tasksError) throw tasksError;

      return (dependentTasks || []).map(task => ({
        id: task.id,
        title: task.title,
        due_date: task.due_date ?? undefined
      }));
    } catch (error) {
      console.error('Error finding dependent tasks:', error);
      return [];
    }
  };

  const checkDependentTasksConflict = async (taskId: string, newDueDate: string): Promise<{ hasConflict: boolean, affectedTasks?: Array<{ id: string, title: string, currentDueDate: string, newDueDate: string }> }> => {
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
    affectedTasks: Array<{ id: string, title: string, currentDueDate: string, newDueDate: string }>,
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
    const validationResult = createTaskSchema.safeParse({ ...newTask, dependencies: [] });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    setValidationErrors({});
    executeCreateTask();
  };

  const executeCreateTask = async (overrideDueDate?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Derive start_date and end_date from due_date if not provided
      let startDate = newTask.start_date || null;
      let endDate = newTask.end_date || null;
      const dueDateValue = overrideDueDate || newTask.due_date || null;

      // If due_date is provided but start_date/end_date are not, use due_date
      if (dueDateValue && !startDate && !endDate) {
        const dueDateOnly = dueDateValue.split('T')[0]; // Extract date part
        startDate = dueDateOnly;
        endDate = dueDateOnly;
      }

      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description?.trim() || null,
        priority: newTask.priority as any,
        estimated_hours: newTask.estimated_hours ? parseFloat(newTask.estimated_hours) : null,
        due_date: dueDateValue,
        start_date: startDate,
        end_date: endDate,
        start_time: newTask.start_time || null,
        end_time: newTask.end_time || null,
        event_id: eventId || newTask.selected_event_id || null,
        created_by: user.id,
        category: getSelectedCategories(resourceAssignments).join(', ') || null,
        assigned_to: null, // Removed user assignment dropdown, only using coordinator assignment
        assigned_coordinator_name: (newTask as any).assigned_coordinator_name || null,
        resource_assignments: resourceAssignments as unknown as Record<string, unknown>
      };

      const { data: createdTask, error } = await supabase
        .from('tasks')
        .insert(taskData as any)
        .select('id')
        .single();

      if (error) throw error;

      // Log task creation
      await supabase.rpc('log_change', {
        p_entity_type: 'task',
        p_entity_id: createdTask.id,
        p_action: 'created',
        p_description: `Created task: ${taskData.title}`
      });

      // Log coordinator assignment if assigned
      if ((newTask as any).assigned_coordinator_name) {
        await supabase.rpc('log_change', {
          p_entity_type: 'task',
          p_entity_id: createdTask.id,
          p_action: 'updated',
          p_field_name: 'assigned_coordinator_name',
          p_new_value: (newTask as any).assigned_coordinator_name,
          p_description: `Task assigned to coordinator: ${(newTask as any).assigned_coordinator_name}`
        });
      }

      // Close dialog and refetch tasks
      setIsCreateDialogOpen(false);
      await fetchTasks();
      await fetchAvailableTasks();

      // Open dependency dialog with the new task
      setTaskForDependencies({ id: createdTask.id, title: newTask.title });
      setShouldPreserveForm(true);
      setShowDependencyDialog(true);

      toast({
        title: "Task Created",
        description: "Now add dependencies (optional)",
      });
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

  const updateTaskAssignment = async (taskId: string, assignedUserId?: string, oldAssignedUserId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get old and new user names for logging
      const oldUser = oldAssignedUserId ? users.find(u => u.userid === oldAssignedUserId) : null;
      const newUser = assignedUserId ? users.find(u => u.userid === assignedUserId) : null;

      // Update assigned_to field directly in tasks table
      const { error } = await supabase
        .from('tasks')
        .update({ assigned_to: assignedUserId || null })
        .eq('id', taskId);

      if (error) throw error;

      // Log assignment change
      if (oldAssignedUserId !== assignedUserId) {
        await supabase.rpc('log_change', {
          p_entity_type: 'task',
          p_entity_id: taskId,
          p_action: 'updated',
          p_field_name: 'assigned_to',
          p_old_value: oldUser?.user_name || (oldAssignedUserId ? 'Unknown User' : 'Unassigned'),
          p_new_value: newUser?.user_name || (assignedUserId ? 'Unknown User' : 'Unassigned'),
          p_description: assignedUserId
            ? `Task reassigned from ${oldUser?.user_name || 'Unassigned'} to ${newUser?.user_name || 'user'}`
            : `Task unassigned from ${oldUser?.user_name || 'user'}`
        });
      }
    } catch (error) {
      console.error('Error updating task assignment:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Get the original task for comparison
      const originalTask = tasks.find(t => t.id === taskId);

      // Remove assigned_user_id, assigned_user_name, and resource_assignments from updates 
      // as they're handled separately or need special handling
      const { assigned_user_id, assigned_user_name, resource_assignments, ...taskUpdates } = updates;

      // Prepare updates for database - convert resource_assignments to JSON if present
      const dbUpdates: Record<string, any> = { ...taskUpdates };
      if (resource_assignments !== undefined) {
        dbUpdates.resource_assignments = resource_assignments as unknown as Record<string, unknown>;
      }

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId);

      if (error) throw error;

      // Log field changes
      if (originalTask) {
        const changes: Array<{ field: string, oldValue: any, newValue: any }> = [];

        if (updates.title && updates.title !== originalTask.title) {
          changes.push({ field: 'title', oldValue: originalTask.title, newValue: updates.title });
        }
        if (updates.description !== undefined && updates.description !== originalTask.description) {
          changes.push({ field: 'description', oldValue: originalTask.description || 'None', newValue: updates.description || 'None' });
        }
        if (updates.status && updates.status !== originalTask.status) {
          changes.push({ field: 'status', oldValue: originalTask.status, newValue: updates.status });
        }
        if (updates.priority && updates.priority !== originalTask.priority) {
          changes.push({ field: 'priority', oldValue: originalTask.priority, newValue: updates.priority });
        }
        if (updates.estimated_hours !== undefined && updates.estimated_hours !== originalTask.estimated_hours) {
          changes.push({ field: 'estimated_hours', oldValue: originalTask.estimated_hours?.toString() || 'None', newValue: updates.estimated_hours?.toString() || 'None' });
        }
        if (updates.due_date !== undefined && updates.due_date !== originalTask.due_date) {
          changes.push({ field: 'due_date', oldValue: originalTask.due_date || 'None', newValue: updates.due_date || 'None' });
        }
        if (updates.start_date !== undefined && updates.start_date !== originalTask.start_date) {
          changes.push({ field: 'start_date', oldValue: originalTask.start_date || 'None', newValue: updates.start_date || 'None' });
        }
        if (updates.end_date !== undefined && updates.end_date !== originalTask.end_date) {
          changes.push({ field: 'end_date', oldValue: originalTask.end_date || 'None', newValue: updates.end_date || 'None' });
        }
        if (updates.start_time !== undefined && updates.start_time !== originalTask.start_time) {
          changes.push({ field: 'start_time', oldValue: originalTask.start_time || 'None', newValue: updates.start_time || 'None' });
        }
        if (updates.end_time !== undefined && updates.end_time !== originalTask.end_time) {
          changes.push({ field: 'end_time', oldValue: originalTask.end_time || 'None', newValue: updates.end_time || 'None' });
        }

        // Log each change
        for (const change of changes) {
          await supabase.rpc('log_change', {
            p_entity_type: 'task',
            p_entity_id: taskId,
            p_action: 'updated',
            p_field_name: change.field,
            p_old_value: String(change.oldValue),
            p_new_value: String(change.newValue),
            p_description: `Updated ${change.field} from "${change.oldValue}" to "${change.newValue}"`
          });
        }
      }

      // Recalculate downstream tasks if due_date changed
      if (updates.due_date !== undefined && originalTask && updates.due_date !== originalTask.due_date) {
        try {
          // Use the new recalculate_downstream_tasks function for due date changes
          const { data: recalcData, error: recalcError } = await supabase.rpc('recalculate_downstream_tasks', {
            p_task_id: taskId,
            p_original_due_date: originalTask.due_date,
            p_new_due_date: updates.due_date
          });

          if (recalcError) {
            console.warn('Failed to recalculate downstream tasks:', recalcError);
            // Don't fail the update if recalculation fails
          } else if (recalcData && Array.isArray(recalcData) && recalcData.length > 0) {
            toast({
              title: "Timeline updated",
              description: `Adjusted ${recalcData.length} downstream task${recalcData.length > 1 ? 's' : ''}.`,
            });
            // Refresh tasks to show updated due dates
            await fetchTasks();
            return; // Early return since fetchTasks will update the UI
          }
        } catch (recalcErr) {
          console.warn('Error recalculating downstream tasks:', recalcErr);
          // Continue with normal update flow
        }
      }

      // Recalculate project timeline if estimated_hours changed
      if (updates.estimated_hours !== undefined && originalTask && updates.estimated_hours !== originalTask.estimated_hours) {
        try {
          // Use the existing recalculate_project_timeline function for estimated hours
          const { data: recalcData, error: recalcError } = await supabase.rpc('recalculate_project_timeline', {
            p_event_id: originalTask.event_id || null
          });

          if (recalcError) {
            console.warn('Failed to recalculate project timeline:', recalcError);
          } else if (recalcData && Array.isArray(recalcData) && recalcData.length > 0) {
            toast({
              title: "Timeline updated",
              description: `Recalculated ${recalcData.length} task${recalcData.length > 1 ? 's' : ''}.`,
            });
            await fetchTasks();
            return;
          }
        } catch (recalcErr) {
          console.warn('Error recalculating project timeline:', recalcErr);
        }
      }

      // Handle user assignment if provided - use assigned_to field directly
      if (assigned_user_id !== undefined) {
        await updateTaskAssignment(taskId, assigned_user_id, originalTask?.assigned_to);
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
    affectedTasks: Array<{ id: string, title: string, currentDueDate: string, newDueDate: string }>
  ) => {
    try {
      // Update the main task first
      const updates: Partial<Task> = {
        title: taskToUpdate.title,
        description: taskToUpdate.description,
        priority: taskToUpdate.priority,
        estimated_hours: taskToUpdate.estimated_hours,
        due_date: taskToUpdate.due_date,
        start_date: taskToUpdate.start_date,
        end_date: taskToUpdate.end_date,
        start_time: taskToUpdate.start_time,
        end_time: taskToUpdate.end_time,
      };

      // Handle assigned_to separately if assigned_user_id is provided
      if (taskToUpdate.assigned_user_id !== undefined) {
        await updateTaskAssignment(taskToUpdate.id, taskToUpdate.assigned_user_id, taskToUpdate.assigned_to);
      }

      await updateTask(taskToUpdate.id, updates);

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
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : (error?.message || "Failed to update tasks. Please try again.");
      const isCircularDependency = errorMessage.includes("Circular dependency detected");
      const isPermissionError = errorMessage.includes("Permission denied") || errorMessage.includes("permission");

      toast({
        title: "Error updating tasks",
        description: isCircularDependency || isPermissionError ? errorMessage : errorMessage,
        variant: "destructive",
      });
    }
  };

  const executeUpdateTask = async (taskToUpdate: Task, overrideDueDate?: string) => {
    try {
      // Handle assigned_to separately if assigned_user_id is provided
      if (taskToUpdate.assigned_user_id !== undefined) {
        await updateTaskAssignment(taskToUpdate.id, taskToUpdate.assigned_user_id, taskToUpdate.assigned_to);
      }

      // Update other task fields
      await updateTask(taskToUpdate.id, {
        title: taskToUpdate.title,
        description: taskToUpdate.description,
        priority: taskToUpdate.priority,
        estimated_hours: taskToUpdate.estimated_hours,
        due_date: overrideDueDate || taskToUpdate.due_date,
        start_date: taskToUpdate.start_date,
        end_date: taskToUpdate.end_date,
        start_time: taskToUpdate.start_time,
        end_time: taskToUpdate.end_time,
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
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : (error?.message || "Failed to update task. Please try again.");
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
      const task = tasks.find(t => t.id === taskId);

      const { error } = await supabase
        .from('tasks')
        .update({ archived })
        .eq('id', taskId);

      if (error) throw error;

      // Log archive/restore action
      await supabase.rpc('log_change', {
        p_entity_type: 'task',
        p_entity_id: taskId,
        p_action: archived ? 'archived' : 'restored',
        p_description: archived
          ? `Archived task: ${task?.title || 'Unknown'}`
          : `Restored task: ${task?.title || 'Unknown'}`
      });

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
          <Button
            variant="outline"
            onClick={async () => {
              try {
                // Update all tasks with old description text
                const { error } = await supabase
                  .from('tasks')
                  .update({ description: 'Enter task collaborator name' })
                  .in('description', [
                    'Assign task responsibilities',
                    'Assign coordinator responsibility',
                    'Assign tasks to team members'
                  ]);

                if (error) throw error;

                toast({
                  title: "Descriptions updated",
                  description: "Task descriptions have been updated successfully.",
                });

                fetchTasks();
              } catch (error) {
                console.error('Error updating descriptions:', error);
                toast({
                  title: "Error",
                  description: "Failed to update task descriptions.",
                  variant: "destructive",
                });
              }
            }}
            className="flex items-center gap-2 text-xs"
          >
            Update Old Descriptions
          </Button>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          if (!open) {
            // Only clear validation errors and search term when closing
            setDependencySearchTerm("");
            setValidationErrors({});
          }
          setIsCreateDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Left column */}
              <div className="space-y-4">
                {!eventId && events.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="event">Select Project/Event *</Label>
                    <Select
                      value={newTask.selected_event_id}
                      onValueChange={(value) => {
                        setNewTask({ ...newTask, selected_event_id: value });
                        setValidationErrors({ ...validationErrors, selected_event_id: "" });
                      }}
                    >
                      <SelectTrigger className={validationErrors.selected_event_id ? "border-destructive" : ""}>
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
                    {validationErrors.selected_event_id && (
                      <p className="text-sm text-destructive">{validationErrors.selected_event_id}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) => {
                      setNewTask({ ...newTask, title: e.target.value });
                      setValidationErrors({ ...validationErrors, title: "" });
                    }}
                    className={validationErrors.title ? "border-destructive" : ""}
                    maxLength={200}
                  />
                  {validationErrors.title && (
                    <p className="text-sm text-destructive">{validationErrors.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{newTask.title.length}/200 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter task description"
                    value={newTask.description}
                    onChange={(e) => {
                      setNewTask({ ...newTask, description: e.target.value });
                      setValidationErrors({ ...validationErrors, description: "" });
                    }}
                    rows={4}
                    className={validationErrors.description ? "border-destructive" : ""}
                    maxLength={1000}
                  />
                  {validationErrors.description && (
                    <p className="text-sm text-destructive">{validationErrors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{newTask.description.length}/1000 characters</p>
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

                {/* Task Assignments selection with status and confirmation - Grid Layout */}
                <div className="space-y-2">
                  <Label>Resource Category Assignments</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select resource categories, set their status, and assign collaborators
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {RESOURCE_CATEGORIES.map((category) => (
                      <ResourceAssignmentRow
                        key={category}
                        category={category}
                        assignment={resourceAssignments[category] || { selected: false, status: 'pending', confirmed: false, collaborator_name: '' }}
                        onAssignmentChange={(newAssignment) => {
                          setResourceAssignments(prev => ({
                            ...prev,
                            [category]: newAssignment
                          }));
                          // Also update selectedCollaboratorTypes for backward compatibility
                          if (newAssignment.selected) {
                            if (!selectedCollaboratorTypes.includes(category)) {
                              setSelectedCollaboratorTypes([...selectedCollaboratorTypes, category]);
                            }
                          } else {
                            setSelectedCollaboratorTypes(selectedCollaboratorTypes.filter(t => t !== category));
                          }
                        }}
                      />
                    ))}
                  </div>
                  {Object.entries(resourceAssignments).filter(([_, a]) => a.selected).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(resourceAssignments)
                        .filter(([_, assignment]) => assignment.selected)
                        .map(([category, assignment]) => (
                          <ResourceAssignmentBadge 
                            key={category} 
                            category={category} 
                            assignment={assignment} 
                          />
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Coordinator Assignment Manual Entry */}
                <div className="space-y-2 p-3 border border-primary/20 rounded-lg bg-primary/5">
                  <Label htmlFor="coordinator-name" className="text-base font-semibold">
                    Assign Collaborator Task To
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enter collaborator name
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="coordinator-name"
                      placeholder="Enter collaborator name (optional)"
                      value={(newTask as any).assigned_coordinator_name || ""}
                      onChange={(e) => {
                        setNewTask({
                          ...newTask,
                          assigned_coordinator_name: e.target.value || undefined
                        } as any);
                      }}
                      className="flex-1"
                    />
                    {(newTask as any).assigned_coordinator_name && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setNewTask({ ...newTask, assigned_coordinator_name: undefined } as any);
                          toast({
                            title: "Collaborator removed",
                            description: "Collaborator assignment cleared",
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours">Estimated Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0.0"
                    value={newTask.estimated_hours}
                    onChange={(e) => {
                      setNewTask({ ...newTask, estimated_hours: e.target.value });
                      setValidationErrors({ ...validationErrors, estimated_hours: "" });
                    }}
                    className={validationErrors.estimated_hours ? "border-destructive" : ""}
                  />
                  {validationErrors.estimated_hours && (
                    <p className="text-sm text-destructive">{validationErrors.estimated_hours}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={newTask.due_date}
                    onChange={(e) => {
                      const dueDate = e.target.value;
                      setNewTask({
                        ...newTask,
                        due_date: dueDate,
                        // Auto-populate start_date and end_date from due_date if not set
                        start_date: newTask.start_date || (dueDate ? dueDate.split('T')[0] : ""),
                        end_date: newTask.end_date || (dueDate ? dueDate.split('T')[0] : "")
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newTask.start_date}
                    onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newTask.end_date}
                    onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={newTask.start_time}
                      onChange={(e) => setNewTask({ ...newTask, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={newTask.end_time}
                      onChange={(e) => setNewTask({ ...newTask, end_time: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setNewTask({
                    title: "",
                    description: "",
                    priority: "medium" as const,
                    estimated_hours: "",
                    due_date: "",
                    start_date: "",
                    end_date: "",
                    start_time: "",
                    end_time: "",
                    selected_event_id: "",
                    dependencies: [] as string[],
                    assigned_role: ""
                  });
                  setSelectedCollaboratorTypes([]);
                  setValidationErrors({});
                  setShouldPreserveForm(false);
                  toast({
                    title: "Form cleared",
                    description: "All fields have been reset.",
                  });
                }}
                className="flex-1"
              >
                Clear Form
              </Button>
              <Button onClick={createTask} className="flex-1">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>


      {loading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No tasks yet. Create your first task to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => {
            const StatusIcon = statusIcons[task.status];
            return (
              <Card
                key={task.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedTask(task);
                  setSelectedDependencies(task.dependencies || []);
                  setIsEditDialogOpen(true);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{task.title}</CardTitle>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={task.priority}
                        onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                          updateTask(task.id, { priority: value })
                        }
                      >
                        <SelectTrigger className={`h-7 text-xs ${priorityColors[task.priority]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <StatusIcon className="h-3 w-3" />
                    <Select value={task.status} onValueChange={(value: any) => updateTask(task.id, { status: value })}>
                      <SelectTrigger className="h-7 text-xs">
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

                  {(task.assigned_user_name || task.assigned_role) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>
                        {task.assigned_user_name || task.assigned_role?.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Resource Category Assignments - Grid Layout */}
                  <div className="border-t pt-3 mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-semibold text-foreground">
                      Resource Category Assignments
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {RESOURCE_CATEGORIES.map((category) => {
                        const currentAssignment = task.resource_assignments?.[category] || 
                          { selected: false, status: 'pending' as const, confirmed: false, collaborator_name: '' };
                        return (
                          <ResourceAssignmentRow
                            key={category}
                            category={category}
                            assignment={currentAssignment}
                            onAssignmentChange={async (newAssignment) => {
                              // Optimistic update
                              const updatedAssignments = {
                                ...(task.resource_assignments || getEmptyResourceAssignments()),
                                [category]: newAssignment
                              };
                              
                              // Update local state immediately
                              setTasks(prevTasks => 
                                prevTasks.map(t => 
                                  t.id === task.id 
                                    ? { ...t, resource_assignments: updatedAssignments }
                                    : t
                                )
                              );
                              
                              // Save to database
                              try {
                                const { error } = await supabase
                                  .from('tasks')
                                  .update({ resource_assignments: JSON.parse(JSON.stringify(updatedAssignments)) })
                                  .eq('id', task.id);
                                
                                if (error) throw error;
                                
                                toast({
                                  title: "Resource updated",
                                  description: `${category} assignment updated successfully.`,
                                });
                              } catch (error) {
                                console.error('Error updating resource assignment:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to update resource assignment.",
                                  variant: "destructive",
                                });
                                // Revert on error
                                fetchTasks();
                              }
                            }}
                            onCollaboratorSave={async (collaboratorName) => {
                              const updatedAssignments = {
                                ...(task.resource_assignments || getEmptyResourceAssignments()),
                                [category]: {
                                  ...currentAssignment,
                                  collaborator_name: collaboratorName
                                }
                              };
                              
                              setTasks(prevTasks => 
                                prevTasks.map(t => 
                                  t.id === task.id 
                                    ? { ...t, resource_assignments: updatedAssignments }
                                    : t
                                )
                              );
                              
                              try {
                                const { error } = await supabase
                                  .from('tasks')
                                  .update({ resource_assignments: JSON.parse(JSON.stringify(updatedAssignments)) })
                                  .eq('id', task.id);
                                
                                if (error) throw error;
                                
                                toast({
                                  title: "Collaborator saved",
                                  description: `${category} collaborator updated to "${collaboratorName}".`,
                                });
                              } catch (error) {
                                console.error('Error saving collaborator:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to save collaborator.",
                                  variant: "destructive",
                                });
                                fetchTasks();
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Assign Collaborator Task To - Manual Name Entry */}
                  <div className="border-t pt-3 mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-semibold text-foreground">
                      Assign Collaborator Task To
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter collaborator name"
                        value={cardCollaboratorInput[task.id] ?? task.assigned_coordinator_name ?? ""}
                        onChange={(e) => {
                          setCardCollaboratorInput(prev => ({
                            ...prev,
                            [task.id]: e.target.value
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 text-sm flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const inputValue = cardCollaboratorInput[task.id] ?? task.assigned_coordinator_name ?? "";
                            const coordinatorValue = inputValue.trim() === "" ? null : inputValue.trim();
                            const { error } = await supabase
                              .from('tasks')
                              .update({ assigned_coordinator_name: coordinatorValue })
                              .eq('id', task.id);

                            if (error) throw error;

                            toast({
                              title: coordinatorValue ? "Collaborator assigned" : "Collaborator removed",
                              description: coordinatorValue
                                ? `${coordinatorValue} has been assigned to this task.`
                                : "Collaborator assignment cleared.",
                            });

                            // Clear the local input state for this task
                            setCardCollaboratorInput(prev => {
                              const newState = { ...prev };
                              delete newState[task.id];
                              return newState;
                            });

                            fetchTasks();
                          } catch (error) {
                            console.error('Error assigning collaborator:', error);
                            toast({
                              title: "Error",
                              description: "Failed to assign collaborator.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {task.estimated_hours && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{task.estimated_hours}h</span>
                    </div>
                  )}

                  {task.due_date && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(task.due_date), 'MMM d')}</span>
                    </div>
                  )}

                  {task.dependencies && task.dependencies.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Link className="h-3 w-3" />
                      <span>{task.dependencies.length} dep{task.dependencies.length > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => archiveTask(task.id, !task.archived)}
                      className="flex items-center gap-1 h-7 text-xs"
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
      )}

      {/* Edit Task Dialog */}
      {selectedTask && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setSelectedDependencies([]);
            setDependencySearchTerm(""); // Reset search term
            setEditResourceAssignments(getEmptyResourceAssignments());
          } else {
            setDependencySearchTerm(""); // Reset search term when opening
            // Initialize editResourceAssignments from selectedTask
            if (selectedTask?.resource_assignments) {
              setEditResourceAssignments(selectedTask.resource_assignments);
            } else {
              setEditResourceAssignments(getEmptyResourceAssignments());
            }
          }
          setIsEditDialogOpen(open);
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

                {/* Resource Category Assignments for Edit - Grid Layout */}
                <div className="space-y-2">
                  <Label>Resource Category Assignments</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select resource categories, set their status, and assign collaborators
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {RESOURCE_CATEGORIES.map((category) => {
                      const currentAssignment = editResourceAssignments[category] || 
                        selectedTask.resource_assignments?.[category] || 
                        { selected: false, status: 'pending' as const, confirmed: false, collaborator_name: '' };
                      return (
                        <ResourceAssignmentRow
                          key={category}
                          category={category}
                          assignment={currentAssignment}
                          onAssignmentChange={(newAssignment) => {
                            setEditResourceAssignments(prev => ({
                              ...prev,
                              [category]: newAssignment
                            }));
                          }}
                        />
                      );
                    })}
                  </div>
                  {Object.entries(editResourceAssignments).filter(([_, a]) => a.selected).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(editResourceAssignments)
                        .filter(([_, assignment]) => assignment.selected)
                        .map(([category, assignment]) => (
                          <ResourceAssignmentBadge 
                            key={category} 
                            category={category} 
                            assignment={assignment} 
                          />
                        ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div className="space-y-2 p-3 border border-primary/20 rounded-lg bg-primary/5">
                  <Label htmlFor="edit-coordinator-name" className="text-base font-semibold">
                    Assign Collaborator Task To
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enter collaborator name
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="edit-coordinator-name"
                      placeholder="Enter collaborator name"
                      value={selectedTask.assigned_coordinator_name || ""}
                      onChange={(e) => {
                        setSelectedTask({
                          ...selectedTask,
                          assigned_coordinator_name: e.target.value || undefined
                        });
                      }}
                      className="flex-1"
                    />
                    {selectedTask.assigned_coordinator_name && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTask({
                            ...selectedTask,
                            assigned_coordinator_name: undefined
                          });
                          toast({
                            title: "Collaborator removed",
                            description: "Collaborator assignment cleared",
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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
                    onChange={(e) => {
                      const dueDate = e.target.value;
                      setSelectedTask({
                        ...selectedTask,
                        due_date: dueDate || undefined,
                        // Auto-populate start_date and end_date from due_date if not set
                        start_date: selectedTask.start_date || (dueDate ? dueDate.split('T')[0] : undefined),
                        end_date: selectedTask.end_date || (dueDate ? dueDate.split('T')[0] : undefined)
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-start_date">Start Date</Label>
                  <Input
                    id="edit-start_date"
                    type="date"
                    value={selectedTask.start_date || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, start_date: e.target.value || undefined })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-end_date">End Date</Label>
                  <Input
                    id="edit-end_date"
                    type="date"
                    value={selectedTask.end_date || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, end_date: e.target.value || undefined })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start_time">Start Time</Label>
                    <Input
                      id="edit-start_time"
                      type="time"
                      value={selectedTask.start_time || ''}
                      onChange={(e) => setSelectedTask({ ...selectedTask, start_time: e.target.value || undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end_time">End Time</Label>
                    <Input
                      id="edit-end_time"
                      type="time"
                      value={selectedTask.end_time || ''}
                      onChange={(e) => setSelectedTask({ ...selectedTask, end_time: e.target.value || undefined })}
                    />
                  </div>
                </div>

                {/* Dependencies selection for editing */}
                {availableTasks.filter(task => task.id !== selectedTask.id).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Task Dependencies (Select Multiple)</Label>
                      <span className="text-xs text-muted-foreground">
                        {selectedDependencies.length} of {availableTasks.filter(t => t.id !== selectedTask.id).length} selected
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Select all tasks that must be completed before this task can start:</p>
                    <Input
                      placeholder="Search by title, description, or assignee..."
                      value={dependencySearchTerm}
                      onChange={(e) => setDependencySearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    <div className="flex gap-2 mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const filteredTasks = availableTasks.filter(task =>
                            task.id !== selectedTask.id && (
                              task.title.toLowerCase().includes(dependencySearchTerm.toLowerCase()) ||
                              (task.assigned_user_name || '').toLowerCase().includes(dependencySearchTerm.toLowerCase())
                            )
                          );
                          setSelectedDependencies(filteredTasks.map(t => t.id));
                        }}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDependencies([])}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                      {availableTasks
                        .filter(task =>
                          task.id !== selectedTask.id && (
                            task.title.toLowerCase().includes(dependencySearchTerm.toLowerCase()) ||
                            (task.assigned_user_name || '').toLowerCase().includes(dependencySearchTerm.toLowerCase())
                          )
                        )
                        .map((task) => (
                          <div key={task.id} className="flex items-start space-x-2 p-2 rounded hover:bg-accent/50 transition-colors">
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
                              className="mt-0.5"
                            />
                            <label htmlFor={`edit-dep-${task.id}`} className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">{task.title}</span>
                                <Badge variant="outline" className={statusColors[task.status]}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              {task.assigned_user_name && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  {task.assigned_user_name}
                                </div>
                              )}
                            </label>
                          </div>
                        ))}
                      {availableTasks.filter(task =>
                        task.id !== selectedTask.id && (
                          task.title.toLowerCase().includes(dependencySearchTerm.toLowerCase()) ||
                          (task.assigned_user_name || '').toLowerCase().includes(dependencySearchTerm.toLowerCase())
                        )
                      ).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No tasks found</p>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedTask(null);
                  setSelectedDependencies([]);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateTask} className="flex-1">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Dependencies Dialog - Step 2 of Task Creation */}
      <Dialog open={showDependencyDialog} onOpenChange={setShowDependencyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Task Dependencies (Optional)</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Task "{taskForDependencies?.title}" has been created! Now you can add dependencies if needed.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {availableTasks.filter(task => task.id !== taskForDependencies?.id).length > 0 ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Select tasks that must be completed first:</Label>
                    <span className="text-xs text-muted-foreground">
                      {selectedDependencies.length} of {availableTasks.filter(t => t.id !== taskForDependencies?.id).length} selected
                    </span>
                  </div>

                  <Input
                    placeholder="Search by title, description, assignee, or category (e.g., Bookings)..."
                    value={dependencySearchTerm}
                    onChange={(e) => setDependencySearchTerm(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Tip: Category search only works for tasks created with collaborator types selected
                  </p>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const filteredTasks = availableTasks.filter(task =>
                          task.id !== taskForDependencies?.id && (
                            task.title.toLowerCase().includes(dependencySearchTerm.toLowerCase()) ||
                            (task.assigned_user_name || '').toLowerCase().includes(dependencySearchTerm.toLowerCase()) ||
                            (task.category || '').toLowerCase().includes(dependencySearchTerm.toLowerCase())
                          )
                        );
                        setSelectedDependencies(filteredTasks.map(t => t.id));
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDependencies([])}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 border rounded-md p-3">
                  {availableTasks
                    .filter(task =>
                      task.id !== taskForDependencies?.id && (
                        task.title.toLowerCase().includes(dependencySearchTerm.toLowerCase()) ||
                        (task.assigned_user_name || '').toLowerCase().includes(dependencySearchTerm.toLowerCase()) ||
                        (task.category || '').toLowerCase().includes(dependencySearchTerm.toLowerCase())
                      )
                    )
                    .map((task) => (
                      <div key={task.id} className="flex items-start space-x-2 p-2 rounded hover:bg-accent/50 transition-colors">
                        <Checkbox
                          id={`new-dep-${task.id}`}
                          checked={selectedDependencies.includes(task.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDependencies([...selectedDependencies, task.id]);
                            } else {
                              setSelectedDependencies(selectedDependencies.filter(id => id !== task.id));
                            }
                          }}
                          className="mt-0.5"
                        />
                        <label htmlFor={`new-dep-${task.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{task.title}</span>
                            <Badge variant="outline" className={statusColors[task.status]}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                            {task.category && task.category.split(', ').map((cat, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                          {task.assigned_user_name && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {task.assigned_user_name}
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                  {(() => {
                    const filteredTasks = availableTasks.filter(task =>
                      task.id !== taskForDependencies?.id && (
                        task.title.toLowerCase().includes(dependencySearchTerm.toLowerCase()) ||
                        (task.assigned_user_name || '').toLowerCase().includes(dependencySearchTerm.toLowerCase()) ||
                        (task.category || '').toLowerCase().includes(dependencySearchTerm.toLowerCase())
                      )
                    );

                    if (filteredTasks.length === 0 && dependencySearchTerm) {
                      const tasksWithoutCategory = availableTasks.filter(t => t.id !== taskForDependencies?.id && !t.category).length;
                      return (
                        <div className="text-center py-4 space-y-2">
                          <p className="text-sm text-muted-foreground">No tasks found matching "{dependencySearchTerm}"</p>
                          {tasksWithoutCategory > 0 && (
                            <p className="text-xs text-muted-foreground">
                              💡 {tasksWithoutCategory} task(s) don't have categories.
                              Tip: Select resource categories when creating tasks to enable category search.
                            </p>
                          )}
                        </div>
                      );
                    }

                    if (filteredTasks.length === 0) {
                      return <p className="text-sm text-muted-foreground text-center py-4">No tasks available</p>;
                    }

                    return null;
                  })()}
                </div>
              </>
            ) : (
              <div className="text-center py-8 space-y-3">
                <p className="text-sm text-muted-foreground">
                  No other tasks available yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Create more tasks first, then you can add dependencies between them.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4 mb-2 px-1">
            <Checkbox
              id="clear-form"
              checked={clearFormAfterSave}
              onCheckedChange={(checked) => setClearFormAfterSave(checked === true)}
            />
            <label htmlFor="clear-form" className="text-sm text-muted-foreground cursor-pointer">
              Clear form after saving (uncheck to create similar tasks)
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDependencyDialog(false);
                setTaskForDependencies(null);
                setSelectedDependencies([]);
                setDependencySearchTerm("");
                setShouldPreserveForm(false);
                setIsCreateDialogOpen(false);

                if (clearFormAfterSave) {
                  setNewTask({
                    title: "",
                    description: "",
                    priority: "medium",
                    estimated_hours: "",
                    due_date: "",
                    start_date: "",
                    end_date: "",
                    start_time: "",
                    end_time: "",
                    selected_event_id: "",
                    dependencies: [],
                    assigned_role: ""
                  });
                  setSelectedCollaboratorTypes([]);
                  setClearFormAfterSave(false);
                }

                toast({
                  title: "Task Created",
                  description: "Task created successfully without dependencies.",
                });
              }}
              className="flex-1"
            >
              Skip Dependencies
            </Button>
            <Button
              onClick={async () => {
                if (!taskForDependencies?.id) return;

                try {
                  if (selectedDependencies.length > 0) {
                    await saveDependencies(taskForDependencies.id, selectedDependencies);
                  }

                  setShowDependencyDialog(false);
                  setTaskForDependencies(null);
                  setSelectedDependencies([]);
                  setDependencySearchTerm("");
                  setShouldPreserveForm(false);
                  setIsCreateDialogOpen(false);

                  if (clearFormAfterSave) {
                    setNewTask({
                      title: "",
                      description: "",
                      priority: "medium",
                      estimated_hours: "",
                      due_date: "",
                      start_date: "",
                      end_date: "",
                      start_time: "",
                      end_time: "",
                      selected_event_id: "",
                      dependencies: [],
                      assigned_role: ""
                    });
                    setSelectedCollaboratorTypes([]);
                    setClearFormAfterSave(false);
                  }

                  await fetchTasks();

                  toast({
                    title: "Dependencies Added",
                    description: selectedDependencies.length > 0
                      ? `${selectedDependencies.length} dependenc${selectedDependencies.length === 1 ? 'y' : 'ies'} added successfully.`
                      : "Task created successfully.",
                  });
                } catch (error: any) {
                  console.error('Error saving dependencies:', error);
                  toast({
                    title: "Error Saving Dependencies",
                    description: error?.message || "Failed to save dependencies. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              className="flex-1"
            >
              Save Dependencies
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                <span className="text-primary font-medium">{dueDateConflictDialog.suggestedDate ? format(new Date(dueDateConflictDialog.suggestedDate), 'MMM dd, yyyy') : 'Not set'}</span>
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