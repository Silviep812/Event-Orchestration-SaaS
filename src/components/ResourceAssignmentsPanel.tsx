import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, Plus, Save } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ResourceAssignment, RESOURCE_CATEGORIES, getEmptyResourceAssignments } from "@/components/ResourceColumn";
import { ResourceAssignmentTableRow } from "@/components/ResourceAssignmentTableRow";

interface AvailableTask {
  id: string;
  title: string;
}

interface ResourceAssignmentsPanelProps {
  taskId: string;
  assignments: Record<string, ResourceAssignment>;
  availableTasks: AvailableTask[];
  isExpanded: boolean;
  onToggle: () => void;
  onAssignmentChange: (category: string, assignment: ResourceAssignment) => void;
  onCollaboratorSave?: (category: string, name: string) => void;
  onDatesSave?: (category: string, dates: { due_date?: string; start_date?: string; end_date?: string }) => void;
  onSaveAll?: () => void;
}

export function ResourceAssignmentsPanel({
  taskId,
  assignments,
  availableTasks,
  isExpanded,
  onToggle,
  onAssignmentChange,
  onCollaboratorSave,
  onDatesSave,
  onSaveAll,
}: ResourceAssignmentsPanelProps) {
  const [addResourceValue, setAddResourceValue] = useState<string>("");

  // Get selected resources
  const selectedAssignments = Object.entries(assignments).filter(
    ([_, assignment]) => assignment.selected
  );

  // Get unselected categories for the "Add" dropdown
  const unselectedCategories = RESOURCE_CATEGORIES.filter(
    (category) => !assignments[category]?.selected
  );

  const selectedCount = selectedAssignments.length;

  const handleAddResource = (category: string) => {
    if (category && !assignments[category]?.selected) {
      const emptyAssignment = getEmptyResourceAssignments()[category];
      onAssignmentChange(category, { ...emptyAssignment, selected: true });
      setAddResourceValue("");
    }
  };

  const handleRemoveResource = (category: string) => {
    const currentAssignment = assignments[category];
    if (currentAssignment) {
      onAssignmentChange(category, {
        ...currentAssignment,
        selected: false,
        collaborator_name: "",
        due_date: "",
        start_date: "",
        end_date: "",
        dependencies: [],
        status: "pending",
        confirmed: false,
      });
    }
  };

  return (
    <div className="border-t mt-3" onClick={(e) => e.stopPropagation()}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 h-8 px-2 hover:bg-muted/50"
            >
              <span className="text-xs font-medium">Resource Assignments</span>
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {selectedCount}
              </Badge>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </CollapsibleTrigger>

          {isExpanded && unselectedCategories.length > 0 && (
            <div className="flex items-center gap-2">
              <Select value={addResourceValue} onValueChange={handleAddResource}>
                <SelectTrigger className="h-7 w-[160px] text-xs">
                  <div className="flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    <span>Add Resource</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-[100]">
                  {unselectedCategories.map((category) => (
                    <SelectItem key={category} value={category} className="text-xs">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="pb-3">
            {selectedCount === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground border rounded-md bg-muted/20">
                No resources assigned. Use "Add Resource" to get started.
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-medium py-2 px-2 w-[120px]">Resource</TableHead>
                      <TableHead className="text-xs font-medium py-2 px-1 min-w-[100px]">Collaborator</TableHead>
                      <TableHead className="text-xs font-medium py-2 px-1 w-[100px]">Due</TableHead>
                      <TableHead className="text-xs font-medium py-2 px-1 w-[100px]">Start</TableHead>
                      <TableHead className="text-xs font-medium py-2 px-1 w-[100px]">End</TableHead>
                      <TableHead className="text-xs font-medium py-2 px-1 w-[90px]">Status</TableHead>
                      <TableHead className="text-xs font-medium py-2 px-1 w-[55px]">Conf</TableHead>
                      <TableHead className="text-xs font-medium py-2 px-1 w-[60px]">Deps</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedAssignments.map(([category, assignment]) => (
                      <ResourceAssignmentTableRow
                        key={category}
                        category={category}
                        assignment={assignment}
                        availableTasks={availableTasks}
                        onUpdate={(newAssignment) =>
                          onAssignmentChange(category, newAssignment)
                        }
                        onRemove={() => handleRemoveResource(category)}
                        onCollaboratorSave={
                          onCollaboratorSave
                            ? (name) => onCollaboratorSave(category, name)
                            : undefined
                        }
                        onDatesSave={
                          onDatesSave
                            ? (dates) => onDatesSave(category, dates)
                            : undefined
                        }
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Save All Button */}
            {selectedCount > 0 && onSaveAll && (
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  onClick={onSaveAll}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save All Resources
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
