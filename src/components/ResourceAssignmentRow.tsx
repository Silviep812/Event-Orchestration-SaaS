import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export type ResourceStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface ResourceAssignment {
  selected: boolean;
  status: ResourceStatus;
  confirmed: boolean;
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

interface ResourceAssignmentRowProps {
  category: string;
  assignment: ResourceAssignment;
  onAssignmentChange: (assignment: ResourceAssignment) => void;
}

export function ResourceAssignmentRow({ 
  category, 
  assignment, 
  onAssignmentChange 
}: ResourceAssignmentRowProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
      {/* Selection Checkbox */}
      <Checkbox
        id={`resource-${category}`}
        checked={assignment.selected}
        onCheckedChange={(checked) => {
          onAssignmentChange({
            ...assignment,
            selected: !!checked,
            // Reset status and confirmed when deselecting
            status: checked ? assignment.status : 'pending',
            confirmed: checked ? assignment.confirmed : false
          });
        }}
      />
      
      {/* Category Name */}
      <label 
        htmlFor={`resource-${category}`} 
        className="text-sm font-medium leading-none cursor-pointer min-w-[140px] flex-shrink-0"
      >
        {category}
      </label>
      
      {/* Status Dropdown */}
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
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-background border shadow-md z-50">
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Confirmation Checkbox */}
      <div className="flex items-center gap-1.5">
        <Checkbox
          id={`confirm-${category}`}
          checked={assignment.confirmed}
          onCheckedChange={(checked) => {
            onAssignmentChange({
              ...assignment,
              confirmed: !!checked
            });
          }}
          disabled={!assignment.selected}
        />
        <label 
          htmlFor={`confirm-${category}`} 
          className={`text-xs leading-none cursor-pointer ${!assignment.selected ? 'text-muted-foreground' : ''}`}
        >
          Confirmed
        </label>
      </div>
    </div>
  );
}

interface ResourceAssignmentBadgeProps {
  category: string;
  assignment: ResourceAssignment;
}

export function ResourceAssignmentBadge({ category, assignment }: ResourceAssignmentBadgeProps) {
  if (!assignment.selected) return null;
  
  return (
    <Badge 
      variant="secondary" 
      className={`text-xs ${resourceStatusColors[assignment.status]} flex items-center gap-1`}
    >
      {category}: {resourceStatusLabels[assignment.status]}
      {assignment.confirmed && <CheckCircle2 className="h-3 w-3" />}
    </Badge>
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
      confirmed: false
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
      confirmed: false
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
