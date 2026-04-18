import { useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, MessageSquare, Package } from "lucide-react";
import { format } from "date-fns";

export type KanbanTaskStatus = "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled";

export interface KanbanTask {
  id: string;
  title: string;
  status: KanbanTaskStatus;
  priority: string;
  due_date?: string;
  assigned_coordinator_name?: string | null;
  assigned_user_name?: string | null;
  category?: string;
  /** From `tasks.resource_assignments` — count of linked event resources */
  linked_resource_count?: number;
}

const COLUMN_IDS = {
  todo: "kanban-todo",
  inProgress: "kanban-in_progress",
  done: "kanban-completed",
} as const;

function columnIdForStatus(status: KanbanTaskStatus): string {
  if (status === "completed") return COLUMN_IDS.done;
  if (status === "in_progress") return COLUMN_IDS.inProgress;
  return COLUMN_IDS.todo;
}

function statusForColumnId(columnId: string): KanbanTaskStatus | null {
  if (columnId === COLUMN_IDS.todo) return "not_started";
  if (columnId === COLUMN_IDS.inProgress) return "in_progress";
  if (columnId === COLUMN_IDS.done) return "completed";
  return null;
}

function resolveDropColumn(overId: string | undefined, tasks: KanbanTask[]): string | null {
  if (!overId) return null;
  if (overId === COLUMN_IDS.todo || overId === COLUMN_IDS.inProgress || overId === COLUMN_IDS.done) {
    return overId;
  }
  const hit = tasks.find((t) => t.id === overId);
  if (!hit) return null;
  return columnIdForStatus(hit.status);
}

function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200";
    case "urgent":
      return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function KanbanColumnDroppable({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[320px] min-w-[260px] flex-1 flex-col rounded-lg border bg-card/50 p-2 transition-colors ${
        isOver ? "border-primary ring-1 ring-primary/30 bg-primary/5" : "border-border"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2 border-b pb-2 px-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-1">{children}</div>
    </div>
  );
}

function KanbanDraggableCard({
  task,
  onOpenTask,
  onOpenComments,
  categoryLabel,
}: {
  task: KanbanTask;
  onOpenTask: (t: KanbanTask) => void;
  onOpenComments: (t: KanbanTask) => void;
  categoryLabel?: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <Card ref={setNodeRef} style={style} className="shadow-sm">
      <CardHeader className="space-y-0 p-3 pb-2">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-muted"
            aria-label="Drag to change column"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-sm font-medium leading-snug">{task.title}</CardTitle>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className={`text-[10px] font-normal ${priorityBadgeClass(task.priority)}`}>
                {task.priority}
              </Badge>
              {categoryLabel ? (
                <Badge variant="secondary" className="max-w-full truncate text-[10px] font-normal">
                  {categoryLabel}
                </Badge>
              ) : null}
              {(task.linked_resource_count ?? 0) > 0 ? (
                <Badge variant="outline" className="text-[10px] font-normal gap-0.5 px-1.5">
                  <Package className="h-3 w-3" aria-hidden />
                  {task.linked_resource_count}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        {task.due_date ? (
          <p className="text-xs text-muted-foreground">Due {format(new Date(task.due_date), "MMM d, yyyy")}</p>
        ) : null}
        {(task.assigned_coordinator_name || task.assigned_user_name) ? (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {task.assigned_coordinator_name || task.assigned_user_name}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">Unassigned</p>
        )}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" className="h-7 flex-1 text-xs" onClick={() => onOpenTask(task)}>
            Open
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2"
            title="Comments"
            onClick={() => onOpenComments(task)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export interface TaskKanbanBoardProps {
  tasks: KanbanTask[];
  onMoveTask: (taskId: string, status: KanbanTaskStatus) => void | Promise<void>;
  onOpenTask: (task: KanbanTask) => void;
  onOpenComments: (task: KanbanTask) => void;
  categoryLabelForTask: (task: KanbanTask) => string | null;
}

export function TaskKanbanBoard({
  tasks,
  onMoveTask,
  onOpenTask,
  onOpenComments,
  categoryLabelForTask,
}: TaskKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const grouped = useMemo(() => {
    const todo: KanbanTask[] = [];
    const ip: KanbanTask[] = [];
    const done: KanbanTask[] = [];
    for (const t of tasks) {
      if (t.status === "completed") done.push(t);
      else if (t.status === "in_progress") ip.push(t);
      else todo.push(t);
    }
    return { todo, inProgress: ip, done };
  }, [tasks]);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    const col = resolveDropColumn(over?.id as string | undefined, tasks);
    if (!col) return;
    const next = statusForColumnId(col);
    if (!next) return;
    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === next) return;
    void onMoveTask(taskId, next);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:overflow-x-auto lg:pb-1">
        <KanbanColumnDroppable id={COLUMN_IDS.todo} title="To Do" count={grouped.todo.length}>
          {grouped.todo.map((task) => (
            <KanbanDraggableCard
              key={task.id}
              task={task}
              onOpenTask={onOpenTask}
              onOpenComments={onOpenComments}
              categoryLabel={categoryLabelForTask(task)}
            />
          ))}
        </KanbanColumnDroppable>
        <KanbanColumnDroppable id={COLUMN_IDS.inProgress} title="In Progress" count={grouped.inProgress.length}>
          {grouped.inProgress.map((task) => (
            <KanbanDraggableCard
              key={task.id}
              task={task}
              onOpenTask={onOpenTask}
              onOpenComments={onOpenComments}
              categoryLabel={categoryLabelForTask(task)}
            />
          ))}
        </KanbanColumnDroppable>
        <KanbanColumnDroppable id={COLUMN_IDS.done} title="Completed" count={grouped.done.length}>
          {grouped.done.map((task) => (
            <KanbanDraggableCard
              key={task.id}
              task={task}
              onOpenTask={onOpenTask}
              onOpenComments={onOpenComments}
              categoryLabel={categoryLabelForTask(task)}
            />
          ))}
        </KanbanColumnDroppable>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <Card className="w-[280px] cursor-grabbing shadow-lg opacity-95">
            <CardHeader className="p-3">
              <CardTitle className="text-sm">{activeTask.title}</CardTitle>
            </CardHeader>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
