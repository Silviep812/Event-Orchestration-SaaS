import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CollaboratorTemplate } from "@/lib/collaboratorChecklists";

type Props = {
  template: CollaboratorTemplate;
  /** Checklist is normally editable in In progress / on hold; use `forceEditable` on new-task form. */
  taskStatus: string;
  state: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
  /** When true (e.g. Add task dialog), allow checking items before the task exists. */
  forceEditable?: boolean;
};

export function CollaboratorChecklistSection({
  template,
  taskStatus,
  state,
  onChange,
  forceEditable = false,
}: Props) {
  const lockedBeforeProgress =
    !forceEditable && (taskStatus === "not_started" || taskStatus === "cancelled");
  const readOnlyDone = taskStatus === "completed";
  const editable =
    forceEditable || taskStatus === "in_progress" || taskStatus === "on_hold";

  return (
    <div className="space-y-3 rounded-md border border-sky-200/80 bg-sky-50/40 p-3 dark:bg-sky-950/20">
      <div>
        <Label className="text-base">{template.title}</Label>
        <p className="text-xs text-muted-foreground mt-1">{template.role}</p>
        {lockedBeforeProgress ? (
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-2">
            This checklist opens when the task is set to <strong>In progress</strong>. Move the task to In progress to
            complete it here.
          </p>
        ) : readOnlyDone ? (
          <p className="text-xs text-muted-foreground mt-2">Task completed — checklist is read-only.</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-2">
            Check off items as work completes. All items must be checked before the task can be marked{" "}
            <strong>Completed</strong> (after the task has been In progress).
          </p>
        )}
      </div>
      <div className="space-y-4 max-h-[min(50vh,420px)] overflow-y-auto pr-1">
        {template.sections.map((section) => (
          <div key={section.title} className="space-y-2">
            <p className="text-sm font-medium">{section.title}</p>
            <div className="space-y-2 pl-1 border-l-2 border-sky-200/90">
              {section.items.map((item) => (
                <div key={item.id} className="flex items-start gap-2">
                  <Checkbox
                    id={`cc-${item.id}`}
                    checked={state[item.id] === true}
                    disabled={!editable}
                    onCheckedChange={(v) =>
                      onChange({
                        ...state,
                        [item.id]: v === true,
                      })
                    }
                  />
                  <label
                    htmlFor={`cc-${item.id}`}
                    className={`text-sm leading-snug ${editable ? "cursor-pointer" : "cursor-not-allowed opacity-80"}`}
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
