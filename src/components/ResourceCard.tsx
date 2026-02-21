import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ResourceAssignment, ResourceStatus } from "@/components/ResourceColumn";

interface AvailableTask {
  id: string;
  title: string;
}

interface ResourceCardProps {
  category: string;
  assignment: ResourceAssignment;
  onAssignmentChange: (assignment: ResourceAssignment) => void;
  onCollaboratorSave?: (collaboratorName: string) => void;
  onDatesSave?: (dates: { due_date?: string; start_date?: string; end_date?: string; start_time?: string; end_time?: string }) => void;
  availableTasks?: AvailableTask[];
}

export function ResourceCard({ 
  category, 
  assignment, 
  onAssignmentChange,
  onCollaboratorSave,
  onDatesSave,
  availableTasks = []
}: ResourceCardProps) {
  const [localCollaborator, setLocalCollaborator] = useState(assignment.collaborator_name || '');
  const [localDueDate, setLocalDueDate] = useState(assignment.due_date || '');
  const [localStartDate, setLocalStartDate] = useState(assignment.start_date || '');
  const [localEndDate, setLocalEndDate] = useState(assignment.end_date || '');
  const [localStartTime, setLocalStartTime] = useState(assignment.start_time || '');
  const [localEndTime, setLocalEndTime] = useState(assignment.end_time || '');

  // Sync local state when assignment prop changes
  useEffect(() => {
    setLocalCollaborator(assignment.collaborator_name || '');
    setLocalDueDate(assignment.due_date || '');
    setLocalStartDate(assignment.start_date || '');
    setLocalEndDate(assignment.end_date || '');
    setLocalStartTime(assignment.start_time || '');
    setLocalEndTime(assignment.end_time || '');
  }, [assignment.collaborator_name, assignment.due_date, assignment.start_date, assignment.end_date, assignment.start_time, assignment.end_time, category]);

  // Debounced save for collaborator changes
  useEffect(() => {
    if (localCollaborator !== (assignment.collaborator_name || '')) {
      const timer = setTimeout(() => {
        if (onCollaboratorSave) {
          onCollaboratorSave(localCollaborator);
        } else {
          onAssignmentChange({
            ...assignment,
            collaborator_name: localCollaborator
          });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [localCollaborator]);

  // Debounced save for date/time changes
  useEffect(() => {
    const hasChanges = 
      localDueDate !== (assignment.due_date || '') ||
      localStartDate !== (assignment.start_date || '') ||
      localEndDate !== (assignment.end_date || '') ||
      localStartTime !== (assignment.start_time || '') ||
      localEndTime !== (assignment.end_time || '');
    
    if (hasChanges) {
      const timer = setTimeout(() => {
        const dates = {
          due_date: localDueDate || undefined,
          start_date: localStartDate || undefined,
          end_date: localEndDate || undefined,
          start_time: localStartTime || undefined,
          end_time: localEndTime || undefined
        };
        if (onDatesSave) {
          onDatesSave(dates);
        } else {
          onAssignmentChange({
            ...assignment,
            ...dates
          });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [localDueDate, localStartDate, localEndDate, localStartTime, localEndTime]);

  return (
    <div className="border rounded-lg p-4 bg-card">
      {/* Header with checkbox and category name */}
      <div className="flex items-center gap-2 border-b pb-2 mb-3">
        <Checkbox
          id={`resource-card-${category}`}
          checked={assignment.selected}
          onCheckedChange={(checked) => {
            onAssignmentChange({
              ...assignment,
              selected: !!checked,
              status: checked ? assignment.status : 'pending',
              confirmed: checked ? assignment.confirmed : false,
              collaborator_name: checked ? assignment.collaborator_name : '',
              due_date: checked ? assignment.due_date : '',
              start_date: checked ? assignment.start_date : '',
              end_date: checked ? assignment.end_date : '',
              start_time: checked ? assignment.start_time : '',
              end_time: checked ? assignment.end_time : '',
              dependencies: checked ? assignment.dependencies : []
            });
            if (!checked) {
              setLocalCollaborator('');
              setLocalDueDate('');
              setLocalStartDate('');
              setLocalEndDate('');
              setLocalStartTime('');
              setLocalEndTime('');
            }
          }}
        />
        <label 
          htmlFor={`resource-card-${category}`} 
          className="text-base font-semibold leading-none cursor-pointer truncate"
          title={category}
        >
          {category}
        </label>
      </div>
      
      {/* Compact details grid - 2 columns within each card */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Status */}
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Status</label>
          <Select
            value={assignment.status}
            onValueChange={(value: ResourceStatus) => {
              onAssignmentChange({
                ...assignment,
                status: value
              });
            }}
            disabled={!assignment.selected}
          >
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border shadow-md z-[100]">
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Confirmation */}
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Confirmed</label>
          <Select
            value={assignment.confirmed ? 'yes' : 'no'}
            onValueChange={(value) => {
              onAssignmentChange({
                ...assignment,
                confirmed: value === 'yes'
              });
            }}
            disabled={!assignment.selected}
          >
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue placeholder="Confirm" />
            </SelectTrigger>
            <SelectContent className="bg-card border shadow-md z-[100]">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Task Assigned To - full width */}
      <div className="space-y-1 mb-3">
        <label className="text-sm font-semibold text-foreground">Task Assigned To</label>
        <Input
          placeholder="Collaborator name"
          value={localCollaborator}
          onChange={(e) => setLocalCollaborator(e.target.value)}
          disabled={!assignment.selected}
          className="h-9 text-sm"
        />
      </div>
      
      {/* Timeline - dates and times */}
      <div className="space-y-1 mb-3">
        <label className="text-sm text-muted-foreground">Timeline</label>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">Due</span>
            <Input
              type="date"
              value={localDueDate}
              onChange={(e) => setLocalDueDate(e.target.value)}
              disabled={!assignment.selected}
              className="h-8 text-sm px-2"
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">Start Date</span>
            <Input
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              disabled={!assignment.selected}
              className="h-8 text-sm px-2"
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">End Date</span>
            <Input
              type="date"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              disabled={!assignment.selected}
              className="h-8 text-sm px-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">Start Time</span>
            <Input
              type="time"
              value={localStartTime}
              onChange={(e) => setLocalStartTime(e.target.value)}
              disabled={!assignment.selected}
              className="h-8 text-sm px-2"
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground">End Time</span>
            <Input
              type="time"
              value={localEndTime}
              onChange={(e) => setLocalEndTime(e.target.value)}
              disabled={!assignment.selected}
              className="h-8 text-sm px-2"
            />
          </div>
        </div>
      </div>

      {/* Dependencies Section */}
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Dependencies</label>
        <Select
          value={assignment.dependencies?.[0] || 'none'}
          onValueChange={(value) => {
            const newDeps = value === 'none' ? [] : [value];
            onAssignmentChange({
              ...assignment,
              dependencies: newDeps
            });
          }}
          disabled={!assignment.selected}
        >
          <SelectTrigger className="h-9 w-full text-sm">
            <SelectValue placeholder="Select dependency" />
          </SelectTrigger>
          <SelectContent className="bg-card border shadow-md z-[100]">
            <SelectItem value="none">None</SelectItem>
            {availableTasks.map(task => (
              <SelectItem key={task.id} value={task.id}>
                {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
