import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Plus, Save, X, ClipboardList, CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  ResourceAssignment,
  ResourceStatus,
  RESOURCE_CATEGORIES,
  getEmptyResourceAssignments,
  ChecklistItem,
  getDefaultChecklist,
} from "@/components/ResourceColumn";
import { DependencyMultiSelect } from "@/components/DependencyMultiSelect";

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

interface ResourceCardProps {
  category: string;
  assignment: ResourceAssignment;
  availableTasks: AvailableTask[];
  onUpdate: (assignment: ResourceAssignment) => void;
  onRemove: () => void;
  onCollaboratorSave?: (name: string) => void;
  onDatesSave?: (dates: { due_date?: string; start_date?: string; end_date?: string }) => void;
}

function CircularProgress({
  percent,
  size = 72,
  strokeWidth = 6,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-sm font-bold text-foreground">{percent}%</span>
    </div>
  );
}

function ResourceCard({
  category,
  assignment,
  availableTasks,
  onUpdate,
  onRemove,
  onCollaboratorSave,
  onDatesSave,
}: ResourceCardProps) {
  const [localCollaborator, setLocalCollaborator] = useState(assignment.collaborator_name || "");
  const [localDueDate, setLocalDueDate] = useState(assignment.due_date || "");
  const [localStartDate, setLocalStartDate] = useState(assignment.start_date || "");
  const [localEndDate, setLocalEndDate] = useState(assignment.end_date || "");
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [wasSelected, setWasSelected] = useState(assignment.selected);

  // Auto-open checklist if this category was just added
  useEffect(() => {
    if (assignment.selected && !wasSelected) {
      setChecklistOpen(true);
    }
    setWasSelected(assignment.selected);
  }, [assignment.selected]);
  const [newItemLabel, setNewItemLabel] = useState("");

  // Initialize checklist from assignment or defaults
  const checklist: ChecklistItem[] =
    assignment.checklist && assignment.checklist.length > 0 ? assignment.checklist : getDefaultChecklist(category);

  const completedCount = checklist.filter((item) => item.completed).length;

  const handleChecklistToggle = (itemId: string, checked: boolean) => {
    const updatedChecklist = checklist.map((item) => (item.id === itemId ? { ...item, completed: checked } : item));
    onUpdate({ ...assignment, checklist: updatedChecklist });
  };
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
    <div className="border rounded-lg p-4 bg-card shadow-sm relative">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-base font-bold text-foreground">{category}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Remove resource"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Collaborator - full width */}
      <div className="mb-3">
        <label className="text-sm font-medium text-foreground block mb-1">Collaborator</label>
        <Input
          placeholder="Enter collaborator name..."
          value={localCollaborator}
          onChange={(e) => setLocalCollaborator(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="h-9 text-sm bg-background border-input"
        />
      </div>

      {/* Dates row - 3 columns */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Due</label>
          <Input
            type="date"
            value={localDueDate}
            onChange={(e) => setLocalDueDate(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="h-9 text-sm bg-background border-input"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Start</label>
          <Input
            type="date"
            value={localStartDate}
            onChange={(e) => setLocalStartDate(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="h-9 text-sm bg-background border-input"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">End</label>
          <Input
            type="date"
            value={localEndDate}
            onChange={(e) => setLocalEndDate(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="h-9 text-sm bg-background border-input"
          />
        </div>
      </div>

      {/* Status & Confirmed row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div onClick={(e) => e.stopPropagation()}>
          <label className="text-sm font-medium text-foreground block mb-1">Status</label>
          <Select
            value={assignment.status}
            onValueChange={(value: ResourceStatus) => onUpdate({ ...assignment, status: value })}
          >
            <SelectTrigger className="h-9 text-sm bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-md z-[100]">
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <label className="text-sm font-medium text-foreground block mb-1">Confirmed</label>
          <Select
            value={assignment.confirmed ? "yes" : "no"}
            onValueChange={(value) => onUpdate({ ...assignment, confirmed: value === "yes" })}
          >
            <SelectTrigger className="h-9 text-sm bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-md z-[100]">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dependencies */}
      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
        <label className="text-sm font-medium text-foreground block mb-1">Dependencies</label>
        <DependencyMultiSelect
          selectedDependencies={assignment.dependencies || []}
          availableTasks={availableTasks}
          onChange={(deps) => onUpdate({ ...assignment, dependencies: deps })}
        />
      </div>

      {/* Checklist Drawer */}
      {checklist.length > 0 && (
        <div onClick={(e) => e.stopPropagation()}>
          <Sheet open={checklistOpen} onOpenChange={setChecklistOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 h-7 text-xs rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <ClipboardList className="h-3 w-3" />
                Open Checklist
                <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5 rounded-full">
                  {completedCount}/{checklist.length}
                </Badge>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[340px] sm:w-[420px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <SheetHeader>
                <SheetTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Resource Checklist
                </SheetTitle>
                <Badge variant="outline" className="w-fit text-xs rounded-full">
                  {category}
                </Badge>
              </SheetHeader>

              {/* Circular Progress */}
              <div className="mt-5 flex flex-col items-center gap-3">
                <CircularProgress
                  percent={checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0}
                />
                <p className="text-xs text-muted-foreground">
                  {completedCount} of {checklist.length} items completed
                </p>
              </div>

              {/* Linear progress bar */}
              <div className="mt-3 px-1">
                <Progress
                  value={checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0}
                  className="h-2"
                />
              </div>

              {/* Checklist Items */}
              <div className="mt-6 space-y-1">
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left hover:bg-muted/50 ${
                      item.completed ? "opacity-70" : ""
                    }`}
                    onClick={() => handleChecklistToggle(item.id, !item.completed)}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <span
                      className={`text-sm leading-snug ${
                        item.completed ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Add custom item */}
              <div className="mt-4 flex items-center gap-2">
                <Input
                  placeholder="Add a checklist item…"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newItemLabel.trim()) {
                      const newItem: ChecklistItem = {
                        id: `custom_${Date.now()}`,
                        label: newItemLabel.trim(),
                        completed: false,
                      };
                      onUpdate({ ...assignment, checklist: [...checklist, newItem] });
                      setNewItemLabel("");
                    }
                  }}
                  className="h-9 text-sm rounded-lg"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 h-9 rounded-lg"
                  disabled={!newItemLabel.trim()}
                  onClick={() => {
                    const newItem: ChecklistItem = {
                      id: `custom_${Date.now()}`,
                      label: newItemLabel.trim(),
                      completed: false,
                    };
                    onUpdate({ ...assignment, checklist: [...checklist, newItem] });
                    setNewItemLabel("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Completion celebration */}
              {completedCount === checklist.length && checklist.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                  <PartyPopper className="h-6 w-6 text-primary shrink-0" />
                  <p className="text-sm font-medium text-foreground">All items complete! 🎉</p>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
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
  const selectedAssignments = Object.entries(assignments).filter(([_, assignment]) => assignment.selected);

  // Get unselected categories for the "Add" dropdown
  const unselectedCategories = RESOURCE_CATEGORIES.filter((category) => !assignments[category]?.selected);

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
            <Button variant="ghost" size="sm" className="flex items-center gap-2 h-8 px-2 hover:bg-muted/50">
              <span className="text-xs font-medium text-black">Resource Assignments</span>
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {selectedCount}
              </Badge>
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>

          {isExpanded && unselectedCategories.length > 0 && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Select value={addResourceValue} onValueChange={handleAddResource}>
                <SelectTrigger className="h-7 w-[140px] text-xs">
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
        <CollapsibleContent className="overflow-visible">
          <div className="pb-3 overflow-visible">
            {selectedCount === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground border rounded-md bg-muted/20">
                No resources assigned. Use "Add Resource" to get started.
              </div>
            ) : (
              <div className="flex flex-col gap-3 w-full isolate" style={{ contain: "layout" }}>
                {selectedAssignments.map(([category, assignment]) => (
                  <div key={category} className="w-full block" style={{ display: "block" }}>
                    <ResourceCard
                      category={category}
                      assignment={assignment}
                      availableTasks={availableTasks}
                      onUpdate={(newAssignment) => onAssignmentChange(category, newAssignment)}
                      onRemove={() => handleRemoveResource(category)}
                      onCollaboratorSave={onCollaboratorSave ? (name) => onCollaboratorSave(category, name) : undefined}
                      onDatesSave={onDatesSave ? (dates) => onDatesSave(category, dates) : undefined}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Save All Button */}
            {selectedCount > 0 && onSaveAll && (
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveAll();
                  }}
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
