import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClipboardList, CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface TaskChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

// Checklist items mapped by assignment_type
const ASSIGNMENT_TYPE_CHECKLISTS: Record<string, string[]> = {
  // Group 1: Bookings, Venues, Hospitality, Transportation
  Bookings: [
    "Confirm availability and service window",
    "Validate compatibility with venue rules and layout",
    "Verify access credentials and load-in requirements",
    "Confirm setup and teardown timing",
    "Coordinate with venue and lead vendors",
  ],
  Venues: [
    "Confirm availability and service window",
    "Validate compatibility with venue rules and layout",
    "Verify access credentials and load-in requirements",
    "Confirm setup and teardown timing",
    "Coordinate with venue and lead vendors",
  ],
  Hospitality: [
    "Confirm availability and service window",
    "Validate compatibility with venue rules and layout",
    "Verify access credentials and load-in requirements",
    "Confirm setup and teardown timing",
    "Coordinate with venue and lead vendors",
  ],
  Transportation: [
    "Confirm availability and service window",
    "Validate compatibility with venue rules and layout",
    "Verify access credentials and load-in requirements",
    "Confirm setup and teardown timing",
    "Coordinate with venue and lead vendors",
  ],
  // Group 2: Vendors, Vendor Service Rental/Buy, Service Vendor, Suppliers
  Vendors: [
    "Define scope of work and deliverables",
    "Finalize agreement or service terms",
    "Log deviations, delays, or issues",
    "Confirm all deliverables received",
    "Process final payment",
  ],
  "Vendor Service Rental/Buy": [
    "Define scope of work and deliverables",
    "Finalize agreement or service terms",
    "Log deviations, delays, or issues",
    "Confirm all deliverables received",
    "Process final payment",
  ],
  "Service Vendor": [
    "Define scope of work and deliverables",
    "Finalize agreement or service terms",
    "Log deviations, delays, or issues",
    "Confirm all deliverables received",
    "Process final payment",
  ],
  Suppliers: [
    "Define scope of work and deliverables",
    "Finalize agreement or service terms",
    "Log deviations, delays, or issues",
    "Confirm all deliverables received",
    "Process final payment",
  ],
  // Group 3: Entertainment
  Entertainment: [
    "Technical rider review (Sound/Light)",
    "Performance schedule alignment",
    "Green room/Hospitality requirements",
    "Soundcheck timing",
  ],
};

export function getChecklistForAssignmentType(assignmentType: string): TaskChecklistItem[] {
  const items = ASSIGNMENT_TYPE_CHECKLISTS[assignmentType];
  if (!items) return [];
  return items.map((label, index) => ({
    id: `${assignmentType.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${index}`,
    label,
    completed: false,
  }));
}

interface TaskChecklistSheetProps {
  taskId: string;
  taskTitle: string;
  assignmentType?: string | null;
  checklist?: TaskChecklistItem[] | null;
  onChecklistSave: (checklist: TaskChecklistItem[]) => Promise<void>;
  onStatusChange: (status: "completed") => Promise<void>;
}

export function TaskChecklistSheet({
  taskId,
  taskTitle,
  assignmentType,
  checklist,
  onChecklistSave,
  onStatusChange,
}: TaskChecklistSheetProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // No assignment type = no checklist
  if (!assignmentType || !ASSIGNMENT_TYPE_CHECKLISTS[assignmentType]) return null;

  // Merge saved checklist with defaults (in case items changed)
  const defaultItems = getChecklistForAssignmentType(assignmentType);
  const currentChecklist: TaskChecklistItem[] =
    checklist && checklist.length > 0
      ? defaultItems.map((defaultItem) => {
          const saved = checklist.find((c) => c.id === defaultItem.id);
          return saved ? { ...defaultItem, completed: saved.completed } : defaultItem;
        })
      : defaultItems;

  const totalItems = currentChecklist.length;
  const completedItems = currentChecklist.filter((i) => i.completed).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleToggle = async (itemId: string, checked: boolean) => {
    const updated = currentChecklist.map((item) =>
      item.id === itemId ? { ...item, completed: checked } : item
    );

    await onChecklistSave(updated);

    // Check if all items are now completed
    const allCompleted = updated.every((item) => item.completed);
    if (allCompleted) {
      toast({
        title: "🎉 Checklist complete!",
        description: "Update task status to Completed?",
        action: (
          <Button
            size="sm"
            variant="default"
            className="ml-2"
            onClick={async () => {
              await onStatusChange("completed");
              toast({
                title: "Task completed",
                description: `"${taskTitle}" has been marked as completed.`,
              });
            }}
          >
            Mark Complete
          </Button>
        ),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 h-7 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <ClipboardList className="h-3 w-3" />
          Open Checklist
          <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5">
            {completedItems}/{totalItems}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-[340px] sm:w-[420px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <SheetHeader>
          <SheetTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Task Checklist
          </SheetTitle>
          <p className="text-sm text-muted-foreground truncate">{taskTitle}</p>
          <Badge variant="outline" className="w-fit text-xs">
            {assignmentType}
          </Badge>
        </SheetHeader>

        {/* Progress Section */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">
              {progressPercent}% Complete
            </span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
          <p className="text-xs text-muted-foreground">
            {completedItems} of {totalItems} items completed
          </p>
        </div>

        {/* Checklist Items */}
        <div className="mt-6 space-y-1">
          {currentChecklist.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left hover:bg-muted/50 ${
                item.completed ? "opacity-70" : ""
              }`}
              onClick={() => handleToggle(item.id, !item.completed)}
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              )}
              <span
                className={`text-sm leading-snug ${
                  item.completed
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Completion celebration */}
        {progressPercent === 100 && (
          <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3">
            <PartyPopper className="h-6 w-6 text-primary shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">All items complete!</p>
              <Button
                size="sm"
                onClick={async () => {
                  await onStatusChange("completed");
                  toast({
                    title: "Task completed",
                    description: `"${taskTitle}" has been marked as completed.`,
                  });
                }}
              >
                Mark Task as Completed
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
