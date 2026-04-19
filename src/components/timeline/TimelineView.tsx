import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isAfter, isBefore, isWithinInterval, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { computeEventLifecycle } from "@/lib/eventStatus";
import { getMissingIepPrerequisites, shouldSkipIepPrerequisiteGuard } from "@/lib/taskBusinessRules";
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
  category?: string | null;
  checklist?: unknown;
  assigned_coordinator_name?: string | null;
  archived?: boolean;
}

interface TimelineViewProps {
  eventId?: string;
  /** Bumps when the parent saves the event or posts a request so timeline + event status stay fresh. */
  refreshKey?: number;
}


type EventRow = {
  id: string;
  title: string;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  archived?: boolean | null;
};

const TimelineView = ({ eventId, refreshKey = 0 }: TimelineViewProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [eventRow, setEventRow] = useState<EventRow | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [overdueFlags, setOverdueFlags] = useState<string[]>([]);
  const [showTimelineIssues, setShowTimelineIssues] = useState(false);
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


  // Fetch event row (status for active / timeline context) and tasks
  useEffect(() => {
    if (!eventId) {
      setTasks([]);
      setEventRow(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchTasks = async () => {
      try {
        const [{ data: evData, error: evErr }, { data, error }] = await Promise.all([
          supabase
            .from("events")
            .select("id, title, status, start_date, end_date, archived")
            .eq("id", eventId)
            .maybeSingle(),
          supabase
            .from('tasks')
            .select('*')
            .eq('event_id', eventId)
            .order('due_date', { ascending: true }),
        ]);
        if (evErr) console.warn(evErr);
        setEventRow(evData ? { ...evData } : null);
        if (error) throw error;
        setTasks(data || []);
        analyzeConstraints(data || []);
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
  }, [eventId, refreshKey]);

  const analyzeConstraints = (taskList: Task[]) => {
    const now = new Date();
    const conflictIds: string[] = [];
    const overdueIds: string[] = [];

    const hasExplicitTimeWindow = (t: Task) =>
      Boolean(t.start_time?.trim() && t.end_time?.trim());

    const skipConflictCheck = (t: Task) =>
      t.status === 'completed' || t.status === 'cancelled';

    // Check for overdue tasks (computed based on due_date vs current time)
    taskList.forEach(task => {
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        if (isAfter(now, dueDate) && task.status !== 'completed') {
          overdueIds.push(task.id);
        }
      }
    });

    // Time conflicts: only when both tasks share a day and both have real start/end times.
    // Missing times used to default to 00:00–23:59, which falsely flagged every same-day pair.
    for (let i = 0; i < taskList.length; i++) {
      for (let j = i + 1; j < taskList.length; j++) {
        const task1 = taskList[i];
        const task2 = taskList[j];

        if (skipConflictCheck(task1) || skipConflictCheck(task2)) continue;

        const task1Start = new Date(task1.start_date);
        const task1End = new Date(task1.end_date);
        const task2Start = new Date(task2.start_date);
        const task2End = new Date(task2.end_date);

        const overlap = isWithinInterval(task1Start, { start: task2Start, end: task2End }) ||
                       isWithinInterval(task1End, { start: task2Start, end: task2End }) ||
                       isWithinInterval(task2Start, { start: task1Start, end: task1End }) ||
                       isWithinInterval(task2End, { start: task1Start, end: task1End });

        if (!overlap || task1.start_date !== task2.start_date) continue;
        if (!hasExplicitTimeWindow(task1) || !hasExplicitTimeWindow(task2)) continue;

        const task1StartTime = parseInt(task1.start_time!.replace(':', ''), 10);
        const task1EndTime = parseInt(task1.end_time!.replace(':', ''), 10);
        const task2StartTime = parseInt(task2.start_time!.replace(':', ''), 10);
        const task2EndTime = parseInt(task2.end_time!.replace(':', ''), 10);

        if (task1StartTime <= task2EndTime && task1EndTime >= task2StartTime) {
          if (!conflictIds.includes(task1.id)) conflictIds.push(task1.id);
          if (!conflictIds.includes(task2.id)) conflictIds.push(task2.id);
        }
      }
    }

    setConflicts(conflictIds);
    setOverdueFlags(overdueIds);
  };

  // Filter tasks by day, week, or month of selectedDate
  const getTasksForSelectedDate = (date: Date | undefined) => {
    if (!date) return tasks;
    const dateStr = format(date, 'yyyy-MM-dd');
    if (viewMode === 'day') {
      return tasks.filter(task => {
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
      return tasks.filter(task => {
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
      return tasks.filter(task => {
        if (!task.due_date) return false;
        const due = new Date(task.due_date);
        return due >= startOfMonth && due <= endOfMonth;
      });
    }
    return tasks;
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
      const originalTask = tasks.find((t) => t.id === taskId);
      const assignmentTouched = Object.prototype.hasOwnProperty.call(updates, "assigned_to");
      const skipIep =
        shouldSkipIepPrerequisiteGuard(updates as Record<string, unknown>) && !assignmentTouched;
      if (originalTask && !skipIep) {
        const effCategory =
          updates.category !== undefined ? updates.category : originalTask.category;
        const effChecklist =
          updates.checklist !== undefined ? updates.checklist : originalTask.checklist;
        const missing = getMissingIepPrerequisites(effCategory, effChecklist);
        if (missing.length > 0) {
          toast({
            title: "Prerequisites incomplete",
            description:
              "Confirm all prerequisite items for this assignment type before saving timeline changes. Open the task in Project Management to check every prerequisite box.",
            variant: "destructive",
          });
          return;
        }
      }

      if (
        assignmentTouched &&
        updates.assigned_to &&
        originalTask?.event_id
      ) {
        const { data: userClash } = await supabase
          .from("tasks")
          .select("id, title")
          .eq("event_id", originalTask.event_id)
          .eq("assigned_to", updates.assigned_to)
          .neq("id", taskId)
          .limit(1);
        if (userClash && userClash.length > 0) {
          toast({
            title: "Assignee already has a task",
            description: `Another task is already assigned to this user: "${userClash[0].title}".`,
            variant: "destructive",
          });
          return;
        }
      }

      // Update in Supabase first
      const { error } = await supabase
        .from('tasks')
        .update(updates as any)
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

  const hasTimelineIssues = conflicts.length > 0 || overdueFlags.length > 0;

  const lifecycle = computeEventLifecycle(eventRow ?? undefined);
  const eventStatusLabel = lifecycle?.eventStatusLabel ?? "";
  const isPastEvent = lifecycle?.isPastEvent ?? false;
  const isCancelled = lifecycle?.isCancelled ?? false;
  const isActiveEvent = !!(eventRow && lifecycle?.isActiveEvent);
  const isArchivedEvent = lifecycle?.isArchived ?? false;

  return (
    <div className="space-y-6">
      {eventRow && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <Badge variant="secondary" className="font-normal">
            {eventRow.title}
          </Badge>
          {eventStatusLabel ? (
            <Badge variant="outline" className="capitalize">
              Event: {eventStatusLabel}
            </Badge>
          ) : null}
          {isArchivedEvent ? (
            <Badge variant="secondary">Archived</Badge>
          ) : isCancelled ? (
            <Badge variant="destructive">Cancelled</Badge>
          ) : isPastEvent ? (
            <Badge variant="secondary">Past event</Badge>
          ) : isActiveEvent ? (
            <Badge className="bg-primary text-primary-foreground">Active event</Badge>
          ) : null}
        </div>
      )}
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Timeline View</h2>
          <p className="text-sm text-muted-foreground">
            {isActiveEvent
              ? "Task statuses stay in sync with Project Management; overdue highlights apply to open work."
              : "Manage task schedules and identify conflicts"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-3 rounded-md border bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <Switch
                id="timeline-show-issues"
                checked={showTimelineIssues}
                onCheckedChange={setShowTimelineIssues}
              />
              <Label htmlFor="timeline-show-issues" className="text-sm font-normal cursor-pointer whitespace-nowrap">
                Show scheduling issues
              </Label>
            </div>
            {!showTimelineIssues && hasTimelineIssues && (
              <span className="text-xs text-muted-foreground shrink-0">Turn on to view</span>
            )}
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
      </div>

      {/* Alerts Section */}
      {showTimelineIssues && hasTimelineIssues && (
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
              showTimelineIssues && conflicts.includes(task.id) && "border-orange-300 bg-orange-50/30",
              showTimelineIssues && overdueFlags.includes(task.id) && "border-red-300 bg-red-50/30"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        getStatusColor(
                          showTimelineIssues && overdueFlags.includes(task.id) ? 'overdue' : task.status
                        )
                      )}
                    />
                    <h3 className="font-medium">{task.title}</h3>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    {showTimelineIssues && conflicts.includes(task.id) && (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Conflict
                      </Badge>
                    )}
                    {showTimelineIssues && overdueFlags.includes(task.id) && (
                      <Badge variant="destructive" className="text-xs">
                        <Flag className="h-3 w-3 mr-1" />
                        Overdue
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