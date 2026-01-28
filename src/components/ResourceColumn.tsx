import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export type ResourceStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface ResourceAssignment {
  selected: boolean;
  status: ResourceStatus;
  confirmed: boolean;
  collaborator_name?: string;
  due_date?: string;
  start_date?: string;
  end_date?: string;
}

export const RESOURCE_CATEGORIES = [
  'Bookings',
  'Vendors',
  'Venues',
  'Hospitality',
  'Vendor Service Rental/Buy',
  'Service Vendor',
  'Transportation',
  'Entertainment',
  'Suppliers',
  'Marketing'
] as const;

export type ResourceCategory = typeof RESOURCE_CATEGORIES[number];

export const resourceStatusColors: Record<ResourceStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
};

export const resourceStatusLabels: Record<ResourceStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

interface ResourceColumnProps {
  category: string;
  assignment: ResourceAssignment;
  onAssignmentChange: (assignment: ResourceAssignment) => void;
  onCollaboratorSave?: (collaboratorName: string) => void;
  onDatesSave?: (dates: { due_date?: string; start_date?: string; end_date?: string }) => void;
}

export function ResourceColumn({ 
  category, 
  assignment, 
  onAssignmentChange,
  onCollaboratorSave,
  onDatesSave
}: ResourceColumnProps) {
  const [localCollaborator, setLocalCollaborator] = useState(assignment.collaborator_name || '');
  const [localDueDate, setLocalDueDate] = useState(assignment.due_date || '');
  const [localStartDate, setLocalStartDate] = useState(assignment.start_date || '');
  const [localEndDate, setLocalEndDate] = useState(assignment.end_date || '');

  const handleCollaboratorSave = () => {
    if (onCollaboratorSave) {
      onCollaboratorSave(localCollaborator);
    } else {
      onAssignmentChange({
        ...assignment,
        collaborator_name: localCollaborator
      });
    }
  };

  const handleDatesSave = () => {
    const dates = {
      due_date: localDueDate || undefined,
      start_date: localStartDate || undefined,
      end_date: localEndDate || undefined
    };
    if (onDatesSave) {
      onDatesSave(dates);
    } else {
      onAssignmentChange({
        ...assignment,
        ...dates
      });
    }
  };

  return (
    <div className="min-w-[200px] border rounded-lg p-3 flex-shrink-0 bg-card">
      {/* Column Header - Resource Name with Checkbox */}
      <div className="flex items-center gap-2 border-b pb-2 mb-3">
        <Checkbox
          id={`resource-${category}`}
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
              end_date: checked ? assignment.end_date : ''
            });
            if (!checked) {
              setLocalCollaborator('');
              setLocalDueDate('');
              setLocalStartDate('');
              setLocalEndDate('');
            }
          }}
        />
        <label 
          htmlFor={`resource-${category}`} 
          className="text-sm font-semibold leading-none cursor-pointer"
        >
          {category}
        </label>
      </div>
      
      {/* Status Row */}
      <div className="space-y-1 mb-3">
        <label className="text-xs text-muted-foreground">Status</label>
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
          <SelectTrigger className="h-8 w-full text-xs">
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
      
      {/* Confirmation Row - Dropdown */}
      <div className="space-y-1 mb-3">
        <label className="text-xs text-muted-foreground">Confirmation</label>
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
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Confirmation" />
          </SelectTrigger>
          <SelectContent className="bg-card border shadow-md z-[100]">
            <SelectItem value="yes">Confirmed</SelectItem>
            <SelectItem value="no">Not Confirmed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Assigned To / Collaborator Row */}
      <div className="space-y-1 mb-3">
        <label className="text-xs text-muted-foreground">Task Assigned To</label>
        <div className="flex gap-1">
          <Input
            placeholder="Collaborator name"
            value={localCollaborator}
            onChange={(e) => setLocalCollaborator(e.target.value)}
            disabled={!assignment.selected}
            className="h-8 text-xs flex-1"
          />
          <Button 
            size="sm" 
            variant="outline" 
            disabled={!assignment.selected}
            onClick={handleCollaboratorSave}
            className="h-8 px-2"
          >
            <Save className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Timeline/Dates Row */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Timeline</label>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-10">Due:</span>
            <Input
              type="date"
              value={localDueDate}
              onChange={(e) => setLocalDueDate(e.target.value)}
              disabled={!assignment.selected}
              className="h-7 text-xs flex-1"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-10">Start:</span>
            <Input
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              disabled={!assignment.selected}
              className="h-7 text-xs flex-1"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-10">End:</span>
            <Input
              type="date"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              disabled={!assignment.selected}
              className="h-7 text-xs flex-1"
            />
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            disabled={!assignment.selected}
            onClick={handleDatesSave}
            className="h-7 w-full text-xs mt-1"
          >
            <Save className="h-3 w-3 mr-1" /> Save Dates
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert string array to ResourceAssignment record
export function convertLegacyToResourceAssignments(
  collaboratorTypes: string[]
): Record<string, ResourceAssignment> {
  const result: Record<string, ResourceAssignment> = {};
  
  RESOURCE_CATEGORIES.forEach(category => {
    result[category] = {
      selected: collaboratorTypes.includes(category),
      status: 'pending',
      confirmed: false,
      collaborator_name: '',
      due_date: '',
      start_date: '',
      end_date: ''
    };
  });
  
  return result;
}

// Helper to get initial empty resource assignments
export function getEmptyResourceAssignments(): Record<string, ResourceAssignment> {
  const result: Record<string, ResourceAssignment> = {};
  
  RESOURCE_CATEGORIES.forEach(category => {
    result[category] = {
      selected: false,
      status: 'pending',
      confirmed: false,
      collaborator_name: '',
      due_date: '',
      start_date: '',
      end_date: ''
    };
  });
  
  return result;
}

// Helper to convert ResourceAssignment record to array of selected categories (for backward compatibility)
export function getSelectedCategories(
  assignments: Record<string, ResourceAssignment>
): string[] {
  return Object.entries(assignments)
    .filter(([_, assignment]) => assignment.selected)
    .map(([category]) => category);
}
