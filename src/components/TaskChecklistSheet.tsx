import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClipboardList } from "lucide-react";
import { ResourceAssignment, ChecklistItem, getDefaultChecklist, RESOURCE_CHECKLISTS } from "@/components/ResourceColumn";

interface TaskChecklistSheetProps {
  taskTitle: string;
  resourceAssignments?: Record<string, ResourceAssignment>;
  onChecklistUpdate: (category: string, updatedAssignment: ResourceAssignment) => void;
}

export function TaskChecklistSheet({ taskTitle, resourceAssignments, onChecklistUpdate }: TaskChecklistSheetProps) {
  const [open, setOpen] = useState(false);

  // Get selected categories that have checklists
  const categoriesWithChecklists = Object.entries(resourceAssignments || {})
    .filter(([category, assignment]) => assignment.selected && RESOURCE_CHECKLISTS[category])
    .map(([category, assignment]) => {
      const checklist: ChecklistItem[] =
        assignment.checklist && assignment.checklist.length > 0
          ? assignment.checklist
          : getDefaultChecklist(category);
      const completed = checklist.filter((i) => i.completed).length;
      return { category, assignment, checklist, completed };
    });

  const totalItems = categoriesWithChecklists.reduce((sum, c) => sum + c.checklist.length, 0);
  const totalCompleted = categoriesWithChecklists.reduce((sum, c) => sum + c.completed, 0);

  if (categoriesWithChecklists.length === 0) return null;

  const handleToggle = (category: string, assignment: ResourceAssignment, checklist: ChecklistItem[], itemId: string, checked: boolean) => {
    const updatedChecklist = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: checked } : item
    );
    onChecklistUpdate(category, { ...assignment, checklist: updatedChecklist });
  };

  const progressPercent = totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-7 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <ClipboardList className="h-3 w-3" />
          Checklist
          <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5">
            {totalCompleted}/{totalItems}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[440px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <SheetHeader>
          <SheetTitle className="text-lg">Resource Checklist</SheetTitle>
          <p className="text-sm text-muted-foreground truncate">{taskTitle}</p>
        </SheetHeader>

        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall Progress</span>
            <span className="font-medium">{totalCompleted}/{totalItems}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="mt-6 space-y-5">
          {categoriesWithChecklists.map(({ category, assignment, checklist, completed }) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{category}</h3>
                <Badge variant={completed === checklist.length ? "default" : "secondary"} className="text-[10px] h-5 px-1.5">
                  {completed}/{checklist.length}
                </Badge>
              </div>
              <div className="space-y-1.5 pl-1">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 py-1">
                    <Checkbox
                      id={`sheet-${category}-${item.id}`}
                      checked={item.completed}
                      onCheckedChange={(checked) =>
                        handleToggle(category, assignment, checklist, item.id, !!checked)
                      }
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={`sheet-${category}-${item.id}`}
                      className={`text-sm cursor-pointer leading-snug ${
                        item.completed ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
