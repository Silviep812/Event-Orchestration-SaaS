import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResourceAssignment, ResourceStatus } from "@/components/ResourceColumn";
import { DependencyMultiSelect } from "@/components/DependencyMultiSelect";
import { X } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";

interface AvailableTask {
  id: string;
  title: string;
}

interface ResourceAssignmentTableRowProps {
  category: string;
  assignment: ResourceAssignment;
  availableTasks: AvailableTask[];
  onUpdate: (assignment: ResourceAssignment) => void;
  onRemove: () => void;
  onCollaboratorSave?: (name: string) => void;
  onDatesSave?: (dates: { due_date?: string; start_date?: string; end_date?: string }) => void;
}

export function ResourceAssignmentTableRow({
  category,
  assignment,
  availableTasks,
  onUpdate,
  onRemove,
  onCollaboratorSave,
  onDatesSave,
}: ResourceAssignmentTableRowProps) {
  const [localCollaborator, setLocalCollaborator] = useState(assignment.collaborator_name || "");
  const [localDueDate, setLocalDueDate] = useState(assignment.due_date || "");
  const [localStartDate, setLocalStartDate] = useState(assignment.start_date || "");
  const [localEndDate, setLocalEndDate] = useState(assignment.end_date || "");

  // Sync local state when assignment prop changes
  useEffect(() => {
    setLocalCollaborator(assignment.collaborator_name || "");
    setLocalDueDate(assignment.due_date || "");
    setLocalStartDate(assignment.start_date || "");
    setLocalEndDate(assignment.end_date || "");
  }, [assignment.collaborator_name, assignment.due_date, assignment.start_date, assignment.end_date]);

  // Debounced save for collaborator
  useEffect(() => {
    if (localCollaborator !== (assignment.collaborator_name || "")) {
      const timer = setTimeout(() => {
        if (onCollaboratorSave) {
          onCollaboratorSave(localCollaborator);
        } else {
          onUpdate({ ...assignment, collaborator_name: localCollaborator });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [localCollaborator]);

  // Debounced save for dates
  useEffect(() => {
    const hasChanges =
      localDueDate !== (assignment.due_date || "") ||
      localStartDate !== (assignment.start_date || "") ||
      localEndDate !== (assignment.end_date || "");

    if (hasChanges) {
      const timer = setTimeout(() => {
        const dates = {
          due_date: localDueDate || undefined,
          start_date: localStartDate || undefined,
          end_date: localEndDate || undefined,
        };
        if (onDatesSave) {
          onDatesSave(dates);
        } else {
          onUpdate({ ...assignment, ...dates });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [localDueDate, localStartDate, localEndDate]);

  return (
    <TableRow className="hover:bg-muted/30">
      {/* Resource Name */}
      <TableCell className="py-2 px-2">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium truncate max-w-[100px]" title={category}>
            {category}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            title="Remove resource"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>

      {/* Collaborator */}
      <TableCell className="py-2 px-1">
        <Input
          placeholder="Collaborator"
          value={localCollaborator}
          onChange={(e) => setLocalCollaborator(e.target.value)}
          className="h-7 text-xs w-full min-w-[100px]"
        />
      </TableCell>

      {/* Due Date */}
      <TableCell className="py-2 px-1">
        <Input
          type="date"
          value={localDueDate}
          onChange={(e) => setLocalDueDate(e.target.value)}
          className="h-7 text-xs w-[100px]"
        />
      </TableCell>

      {/* Start Date */}
      <TableCell className="py-2 px-1">
        <Input
          type="date"
          value={localStartDate}
          onChange={(e) => setLocalStartDate(e.target.value)}
          className="h-7 text-xs w-[100px]"
        />
      </TableCell>

      {/* End Date */}
      <TableCell className="py-2 px-1">
        <Input
          type="date"
          value={localEndDate}
          onChange={(e) => setLocalEndDate(e.target.value)}
          className="h-7 text-xs w-[100px]"
        />
      </TableCell>

      {/* Status */}
      <TableCell className="py-2 px-1">
        <Select
          value={assignment.status}
          onValueChange={(value: ResourceStatus) =>
            onUpdate({ ...assignment, status: value })
          }
        >
          <SelectTrigger className="h-7 w-[90px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border shadow-md z-[100]">
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>

      {/* Confirmed */}
      <TableCell className="py-2 px-1">
        <Select
          value={assignment.confirmed ? "yes" : "no"}
          onValueChange={(value) =>
            onUpdate({ ...assignment, confirmed: value === "yes" })
          }
        >
          <SelectTrigger className="h-7 w-[55px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border shadow-md z-[100]">
            <SelectItem value="yes">Y</SelectItem>
            <SelectItem value="no">N</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>

      {/* Dependencies */}
      <TableCell className="py-2 px-1">
        <DependencyMultiSelect
          selectedDependencies={assignment.dependencies || []}
          availableTasks={availableTasks}
          onChange={(deps) => onUpdate({ ...assignment, dependencies: deps })}
        />
      </TableCell>
    </TableRow>
  );
}
