import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link2 } from "lucide-react";

interface AvailableTask {
  id: string;
  title: string;
}

interface DependencyMultiSelectProps {
  selectedDependencies: string[];
  availableTasks: AvailableTask[];
  onChange: (dependencies: string[]) => void;
  disabled?: boolean;
}

export function DependencyMultiSelect({
  selectedDependencies,
  availableTasks,
  onChange,
  disabled = false,
}: DependencyMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (taskId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedDependencies, taskId]);
    } else {
      onChange(selectedDependencies.filter((id) => id !== taskId));
    }
  };

  const selectedCount = selectedDependencies.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 px-2 text-xs min-w-[60px]"
        >
          <Link2 className="h-3 w-3 mr-1" />
          {selectedCount > 0 ? `${selectedCount}` : "0"}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-2 bg-popover border shadow-lg z-[100] pointer-events-auto" 
        align="start"
        side="bottom"
      >
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-1 pb-1 border-b">
            Select Dependencies
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
            {availableTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1 py-2">
                No other tasks available
              </p>
            ) : (
              availableTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() =>
                    handleToggle(task.id, !selectedDependencies.includes(task.id))
                  }
                >
                  <Checkbox
                    checked={selectedDependencies.includes(task.id)}
                    onCheckedChange={(checked) =>
                      handleToggle(task.id, !!checked)
                    }
                    className="pointer-events-none"
                  />
                  <span className="text-xs truncate flex-1" title={task.title}>
                    {task.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
