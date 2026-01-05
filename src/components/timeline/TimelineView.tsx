import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isAfter, isBefore, isWithinInterval, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  CalendarIcon, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Flag,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  estimated_hours?: number;
  actual_hours?: number;
  dependencies?: string[];
  event_id?: string;
  due_date?: string;
  is_overdue?: boolean;
  is_misaligned?: boolean;
  event_location?: string;
  event_title?: string;
}

interface TimelineViewProps {
  eventId?: string;
}


const TimelineView = ({ eventId }: TimelineViewProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [overdueFlags, setOverdueFlags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Old mock data for reference
  // const mockTasks: Task[] = [
  //    {
  //      id: '1',
  //      title: 'Venue Booking',
  //      description: 'Secure and confirm venue reservation',
  //      start_date: format(new Date(), 'yyyy-MM-dd'),
  //      end_date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
  //      start_time: '09:00',
  //      end_time: '17:00',
  //      status: 'in_progress',
  //      priority: 'high',
  //      estimated_hours: 16,
  //      dependencies: [],
  //      event_id: eventId
  //    },
  //    {
  //      id: '2',
  //      title: 'Catering Selection',
  //      description: 'Choose catering service and menu',
  //      start_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  //      end_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
  //      start_time: '10:00',
  //      end_time: '16:00',
  //      status: 'not_started',
  //      priority: 'medium',
  //      estimated_hours: 12,
  //      dependencies: ['1'],
  //      event_id: eventId
  //    },
  //    {
  //      id: '3',
  //      title: 'Equipment Setup',
  //      description: 'Setup audio/visual equipment',
  //      start_date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
  //      end_date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
  //      start_time: '08:00',
  //      end_time: '12:00',
  //      status: 'not_started',
  //      priority: 'urgent',
  //      estimated_hours: 4,
  //      dependencies: ['1'],
  //      event_id: eventId
  //    },
  //    {
  //      id: '4',
  //      title: 'Final Inspection',
  //      description: 'Final walkthrough and inspection',
  //      start_date: format(addDays(new Date(), -1), 'yyyy-MM-dd'),
  //      end_date: format(addDays(new Date(), -1), 'yyyy-MM-dd'),
  //      start_time: '14:00',
  //      end_time: '18:00',
  //      status: 'overdue',
  //      priority: 'high',
  //      estimated_hours: 4,
  //      dependencies: ['1', '2', '3'],
  //      event_id: eventId
  //    }


  // Fetch real tasks for the selected event using the timeline view
  useEffect(() => {
    if (!eventId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('event_task_timeline_view')
          .select('*')
          .eq('event_id', eventId)
          .order('due_date', { ascending: true });
          console.log('Fetched tasks from timeline view:', data, error);
        if (error) throw error;
        const tasksData = (data || []).map((task: any) => {
          // Use due_date as fallback for start_date/end_date if they're null
          const dueDate = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : null;
          return {
            ...task,
            start_date: task.start_date || dueDate || '',
            end_date: task.end_date || dueDate || '',
          };
        });
        setTasks(tasksData);
        analyzeConstraints(tasksData);
      } catch (error) {
        toast({
          title: 'Error fetching tasks',
          description: 'Could not load tasks for this event.',
          variant: 'destructive',
        });
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const analyzeConstraints = (taskList: Task[]) => {
    const conflictIds: string[] = [];
    const overdueIds: string[] = [];

    // Use is_overdue flag from database view
    taskList.forEach(task => {
      if (task.is_overdue) {
        overdueIds.push(task.id);
      }
      if (task.is_misaligned) {
        // Misaligned tasks are also considered issues
        if (!overdueIds.includes(task.id)) {
          overdueIds.push(task.id);
        }
      }
    });

    // Check for overlapping tasks (simplified - same day overlaps)
    for (let i = 0; i < taskList.length; i++) {
      for (let j = i + 1; j < taskList.length; j++) {
        const task1 = taskList[i];
        const task2 = taskList[j];
        
        // Check date overlap
        const task1Start = new Date(task1.start_date);
        const task1End = new Date(task1.end_date);
        const task2Start = new Date(task2.start_date);
        const task2End = new Date(task2.end_date);

        const overlap = isWithinInterval(task1Start, { start: task2Start, end: task2End }) ||
                       isWithinInterval(task1End, { start: task2Start, end: task2End }) ||
                       isWithinInterval(task2Start, { start: task1Start, end: task1End }) ||
                       isWithinInterval(task2End, { start: task1Start, end: task1End });

        if (overlap && task1.start_date === task2.start_date) {
          // Check time overlap on same day
          const task1StartTime = parseInt(task1.start_time?.replace(':', '') || '0000');
          const task1EndTime = parseInt(task1.end_time?.replace(':', '') || '2359');
          const task2StartTime = parseInt(task2.start_time?.replace(':', '') || '0000');
          const task2EndTime = parseInt(task2.end_time?.replace(':', '') || '2359');

          if ((task1StartTime <= task2EndTime && task1EndTime >= task2StartTime)) {
            if (!conflictIds.includes(task1.id)) conflictIds.push(task1.id);
            if (!conflictIds.includes(task2.id)) conflictIds.push(task2.id);
          }
        }
      }
    }

    setConflicts(conflictIds);
    setOverdueFlags(overdueIds);
  };

  // Filter tasks by day, week, or month of selectedDate, and by issues if enabled
  const getTasksForSelectedDate = (date: Date | undefined) => {
    let filteredTasks = tasks;
    
    // Filter by issues if enabled
    if (showOnlyIssues) {
      filteredTasks = filteredTasks.filter(task => task.is_overdue || task.is_misaligned);
    }
    
    if (!date) return filteredTasks;
    const dateStr = format(date, 'yyyy-MM-dd');
    if (viewMode === 'day') {
      return filteredTasks.filter(task => {
        if (!task.due_date) return false;
        return format(new Date(task.due_date), 'yyyy-MM-dd') === dateStr;
      });
    }
    if (viewMode === 'week') {
      // Get start and end of week (Sunday to Saturday)
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return filteredTasks.filter(task => {
        if (!task.due_date) return false;
        const due = new Date(task.due_date);
        return due >= startOfWeek && due <= endOfWeek;
      });
    }
    if (viewMode === 'month') {
      const year = date.getFullYear();
      const month = date.getMonth();
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      return filteredTasks.filter(task => {
        if (!task.due_date) return false;
        const due = new Date(task.due_date);
        return due >= startOfMonth && due <= endOfMonth;
      });
    }
    return filteredTasks;
  };

  const getStatusColor = (status: Task['status'] | 'overdue') => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 text-red-700 bg-red-50';
      case 'high': return 'border-orange-500 text-orange-700 bg-orange-50';
      case 'medium': return 'border-yellow-500 text-yellow-700 bg-yellow-50';
      default: return 'border-blue-500 text-blue-700 bg-blue-50';
    }
  };

  const DateTimePicker = ({ task, onUpdate }: { task: Task; onUpdate: (updates: Partial<Task>) => void }) => {
    const [startDate, setStartDate] = useState<Date | undefined>(
      task.start_date ? new Date(task.start_date.replace(/-/g, '/')) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
      task.end_date ? new Date(task.end_date.replace(/-/g, '/')) : undefined
    );

    return (
      <div className="space-y-4">
        <div>
          <Label>Start Date & Time</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    onUpdate({ start_date: date ? format(date, 'yyyy-MM-dd') : '' });
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              value={task.start_time || ''}
              onChange={(e) => onUpdate({ start_time: e.target.value })}
              className="w-32"
            />
          </div>
        </div>
        
        <div>
          <Label>End Date & Time</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (startDate && date && isBefore(date, startDate)) {
                      toast({
                        title: "Invalid End Date",
                        description: "End date cannot be before the start date.",
                        variant: "destructive",
                      });
                    } else {
                      setEndDate(date);
                      onUpdate({ end_date: date ? format(date, 'yyyy-MM-dd') : '' });
                    }
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              value={task.end_time || ''}
              onChange={(e) => {
                const newEndTime = e.target.value;
                const startTime = task.start_time;
                const isSameDay = startDate && endDate && format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');

                if (isSameDay && startTime && newEndTime && newEndTime < startTime) {
                  toast({
                    title: "Invalid End Time",
                    description: "End time cannot be before start time on the same day.",
                    variant: "destructive",
                  });
                } else {
                  onUpdate({ end_time: newEndTime });
                }
              }}
              className="w-32"
            />
          </div>
        </div>
      </div>
    );
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Update in Supabase first
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      // Update local state only if Supabase update succeeds
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      setTasks(updatedTasks);
      analyzeConstraints(updatedTasks);
      
      toast({
        title: "Task Updated",
        description: "Task has been saved successfully",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to save task changes",
        variant: "destructive",
      });
    }
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
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Timeline & Task Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your event timeline and tasks
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: 'all'| 'day' | 'week' | 'month' ) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={showOnlyIssues ? "default" : "outline"}
            onClick={() => setShowOnlyIssues(!showOnlyIssues)}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            {showOnlyIssues ? "Show All" : "Show Only Issues"}
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Alerts Section */}
      {(conflicts.length > 0 || overdueFlags.length > 0) && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Timeline Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {conflicts.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-orange-500" />
                <span>{conflicts.length} task conflicts found</span>
              </div>
            )}
            {overdueFlags.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Flag className="h-4 w-4 text-red-500" />
                <span>{overdueFlags.length} overdue tasks</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {getTasksForSelectedDate(selectedDate).map((task) => (
          <Card 
            key={task.id} 
            className={cn(
              "shadow-sm border transition-all",
              conflicts.includes(task.id) && "border-orange-300 bg-orange-50/30",
              overdueFlags.includes(task.id) && "border-red-300 bg-red-50/30"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-3 h-3 rounded-full", getStatusColor(overdueFlags.includes(task.id) ? 'overdue' : task.status))} />
                    <h3 className="font-medium">{task.title}</h3>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    {conflicts.includes(task.id) && (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Conflict
                      </Badge>
                    )}
                    {overdueFlags.includes(task.id) && (
                      <Badge variant="destructive" className="text-xs">
                        <Flag className="h-3 w-3 mr-1" />
                        Overdue
                      </Badge>
                    )}
                    {task.is_misaligned && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Misaligned
                      </Badge>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}
                </div>
                
                <Select
                  value={task.status}
                  onValueChange={(value: Task['status']) => updateTask(task.id, { status: value })}
                >
                  <SelectTrigger className="w-36">
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
            </CardHeader>
            
            <CardContent className="space-y-4">
              <DateTimePicker
                task={task}
                onUpdate={(updates) => updateTask(task.id, updates)}
              />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-muted-foreground">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {task.estimated_hours || 0}h estimated
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      {task.actual_hours || 0}h logged
                    </span>
                  </div>
                  
                  {/* Hour Logging Section */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`hours-${task.id}`} className="text-xs">Log hours:</Label>
                    <Input
                      id={`hours-${task.id}`}
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      className="w-20 h-8 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const hoursToAdd = parseFloat(input.value);
                          if (hoursToAdd > 0) {
                            const newActualHours = (task.actual_hours || 0) + hoursToAdd;
                            updateTask(task.id, { actual_hours: newActualHours });
                            input.value = '';
                            toast({
                              title: "Hours Logged",
                              description: `Added ${hoursToAdd}h to ${task.title}`,
                            });
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        const input = document.getElementById(`hours-${task.id}`) as HTMLInputElement;
                        const hoursToAdd = parseFloat(input.value);
                        if (hoursToAdd > 0) {
                          const newActualHours = (task.actual_hours || 0) + hoursToAdd;
                          updateTask(task.id, { actual_hours: newActualHours });
                          input.value = '';
                          toast({
                            title: "Hours Logged",
                            description: `Added ${hoursToAdd}h to ${task.title}`,
                          });
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {task.dependencies && task.dependencies.length > 0 && (
                    <span className="text-xs">Depends on: {task.dependencies.join(', ')}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {task.start_date} {task.start_time} → {task.end_date} {task.end_time}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TimelineView;