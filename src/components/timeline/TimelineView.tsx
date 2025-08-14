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
  CheckCircle, 
  XCircle, 
  Plus,
  Flag,
  Trash2
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  estimated_hours?: number;
  dependencies?: string[];
  event_id?: string;
}

interface TimelineViewProps {
  eventId?: string;
}

const TimelineView = ({ eventId }: TimelineViewProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [overdueFlags, setOverdueFlags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Mock tasks for demonstration
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Venue Booking',
        description: 'Secure and confirm venue reservation',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '17:00',
        status: 'in_progress',
        priority: 'high',
        estimated_hours: 16,
        dependencies: [],
        event_id: eventId
      },
      {
        id: '2',
        title: 'Catering Selection',
        description: 'Choose catering service and menu',
        start_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
        start_time: '10:00',
        end_time: '16:00',
        status: 'not_started',
        priority: 'medium',
        estimated_hours: 12,
        dependencies: ['1'],
        event_id: eventId
      },
      {
        id: '3',
        title: 'Equipment Setup',
        description: 'Setup audio/visual equipment',
        start_date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
        start_time: '08:00',
        end_time: '12:00',
        status: 'not_started',
        priority: 'urgent',
        estimated_hours: 4,
        dependencies: ['1'],
        event_id: eventId
      },
      {
        id: '4',
        title: 'Final Inspection',
        description: 'Final walkthrough and inspection',
        start_date: format(addDays(new Date(), -1), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), -1), 'yyyy-MM-dd'),
        start_time: '14:00',
        end_time: '18:00',
        status: 'overdue',
        priority: 'high',
        estimated_hours: 4,
        dependencies: ['1', '2', '3'],
        event_id: eventId
      }
    ];

    setTasks(mockTasks);
    analyzeConstraints(mockTasks);
    setLoading(false);
  }, [eventId]);

  const analyzeConstraints = (taskList: Task[]) => {
    const now = new Date();
    const conflictIds: string[] = [];
    const overdueIds: string[] = [];

    // Check for overdue tasks
    taskList.forEach(task => {
      const endDate = new Date(task.end_date + 'T' + (task.end_time || '23:59'));
      if (isAfter(now, endDate) && task.status !== 'completed') {
        overdueIds.push(task.id);
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

  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter(task => {
      const taskStart = new Date(task.start_date);
      const taskEnd = new Date(task.end_date);
      const checkDate = new Date(dateStr);
      
      return isWithinInterval(checkDate, { start: taskStart, end: taskEnd }) ||
             task.start_date === dateStr ||
             task.end_date === dateStr;
    });
  };

  const getStatusColor = (status: Task['status']) => {
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
      task.start_date ? new Date(task.start_date) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
      task.end_date ? new Date(task.end_date) : undefined
    );

    return (
      <div className="grid grid-cols-2 gap-4">
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
                    setEndDate(date);
                    onUpdate({ end_date: date ? format(date, 'yyyy-MM-dd') : '' });
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              value={task.end_time || ''}
              onChange={(e) => onUpdate({ end_time: e.target.value })}
              className="w-32"
            />
          </div>
        </div>
      </div>
    );
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    setTasks(updatedTasks);
    analyzeConstraints(updatedTasks);
    
    toast({
      title: "Task Updated",
      description: "Timeline has been recalculated for constraints",
    });
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
          <h2 className="text-xl font-semibold">Timeline View</h2>
          <p className="text-sm text-muted-foreground">
            Manage task schedules and identify conflicts
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: 'day' | 'week' | 'month') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
        {tasks.map((task) => (
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
                    <div className={cn("w-3 h-3 rounded-full", getStatusColor(task.status))} />
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
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <DateTimePicker
                task={task}
                onUpdate={(updates) => updateTask(task.id, updates)}
              />
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {task.estimated_hours}h estimated
                  </span>
                  {task.dependencies && task.dependencies.length > 0 && (
                    <span>Depends on: {task.dependencies.join(', ')}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span>
                    {task.start_date} {task.start_time} → {task.end_date} {task.end_time}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TimelineView;