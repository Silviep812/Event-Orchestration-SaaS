import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ClipboardList, CheckCircle2, Circle, PartyPopper, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChecklistTemplates, groupTemplatesByCategory } from "@/hooks/useChecklistTemplates";

export interface TaskChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface TaskChecklistSheetProps {
  taskId: string;
  taskTitle: string;
  assignmentType?: string | null;
  resourceCategories?: string[];
  checklist?: TaskChecklistItem[] | null;
  onChecklistSave: (checklist: TaskChecklistItem[]) => Promise<void>;
  onStatusChange: (status: "completed") => Promise<void>;
}

// Circular Progress Ring component
function CircularProgress({ percent, size = 72, strokeWidth = 6 }: { percent: number; size?: number; strokeWidth?: number }) {
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

export function TaskChecklistSheet({
  taskId,
  taskTitle,
  assignmentType,
  resourceCategories,
  checklist,
  onChecklistSave,
  onStatusChange,
}: TaskChecklistSheetProps) {
  const [open, setOpen] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const { toast } = useToast();
  const { data: templates, isLoading } = useChecklistTemplates();

  const categoryMap = templates ? groupTemplatesByCategory(templates) : {};
  const availableCategories = Object.keys(categoryMap);

  const effectiveAssignmentType = (() => {
    if (assignmentType && availableCategories.includes(assignmentType)) return assignmentType;
    if (resourceCategories && resourceCategories.length > 0) {
      return resourceCategories.find((cat) =>
        availableCategories.some((ac) => ac.trim() === cat.trim())
      ) || null;
    }
    return null;
  })();

  if (!effectiveAssignmentType) return null;

  const matchedCategoryKey = availableCategories.find(
    (ac) => ac.trim() === effectiveAssignmentType.trim()
  ) || effectiveAssignmentType;

  const items = categoryMap[matchedCategoryKey] || [];
  if (items.length === 0 && !isLoading) return null;

  const defaultItems: TaskChecklistItem[] = items.map((label, index) => ({
    id: `${matchedCategoryKey.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${index}`,
    label,
    completed: false,
  }));

  const currentChecklist: TaskChecklistItem[] = (() => {
    const merged = defaultItems.map((defaultItem) => {
      const saved = checklist?.find((c) => c.id === defaultItem.id);
      return saved ? { ...defaultItem, completed: saved.completed } : defaultItem;
    });
    const templateIds = new Set(defaultItems.map((d) => d.id));
    const customItems = (checklist || []).filter((c) => !templateIds.has(c.id));
    return [...merged, ...customItems];
  })();

  const totalItems = currentChecklist.length;
  const completedItems = currentChecklist.filter((i) => i.completed).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleToggle = async (itemId: string, checked: boolean) => {
    const updated = currentChecklist.map((item) =>
      item.id === itemId ? { ...item, completed: checked } : item
    );

    await onChecklistSave(updated);

    toast({
      title: checked ? "Item completed" : "Item unchecked",
      description: `Checklist progress: ${updated.filter(i => i.completed).length}/${totalItems}`,
    });

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

  const handleAddItem = async () => {
    const label = newItemLabel.trim();
    if (!label) return;
    const newItem: TaskChecklistItem = {
      id: `custom_${Date.now()}`,
      label,
      completed: false,
    };
    const updated = [...currentChecklist, newItem];
    setNewItemLabel("");
    await onChecklistSave(updated);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
          <Badge variant="outline" className="w-fit text-xs rounded-full">
            {effectiveAssignmentType}
          </Badge>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading checklist…</span>
          </div>
        ) : (
          <>
            {/* Circular Progress Ring */}
            <div className="mt-5 flex flex-col items-center gap-3">
              <CircularProgress percent={progressPercent} />
              <p className="text-xs text-muted-foreground">
                {completedItems} of {totalItems} items completed
              </p>
            </div>

            {/* Linear progress bar */}
            <div className="mt-3 px-1">
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Checklist Items */}
            <div className="mt-6 space-y-1">
              {currentChecklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left hover:bg-muted/50 ${
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

            {/* Add custom checklist item */}
            <div className="mt-4 flex items-center gap-2">
              <Input
                placeholder="Add a checklist item…"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newItemLabel.trim()) {
                    handleAddItem();
                  }
                }}
                className="h-9 text-sm rounded-lg"
              />
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-9 rounded-lg"
                disabled={!newItemLabel.trim()}
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Completion celebration */}
            {progressPercent === 100 && (
              <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                <PartyPopper className="h-6 w-6 text-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">All items complete!</p>
                  <Button
                    size="sm"
                    className="rounded-lg"
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
