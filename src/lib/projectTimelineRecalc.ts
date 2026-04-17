import { supabase } from "@/integrations/supabase/client";

/**
 * After resource or location mutations for an event, ask the database to refresh dependent timeline data.
 * Safe no-op when RPC is missing or RLS denies (logs warning only).
 */
export async function recalculateProjectTimelineForEvent(eventId: string | null | undefined): Promise<void> {
  if (!eventId) return;
  const { error } = await supabase.rpc("recalculate_project_timeline", { p_event_id: eventId });
  if (error) {
    console.warn("recalculate_project_timeline:", error.message);
  }
}

/**
 * When a task due date moves, propagate to dependent tasks if the RPC exists.
 */
export async function recalculateDownstreamTasksForDueDateChange(args: {
  taskId: string;
  newDueDate: string;
  originalDueDate: string | null;
}): Promise<void> {
  const { taskId, newDueDate, originalDueDate } = args;
  const orig = originalDueDate || newDueDate;
  const { error } = await supabase.rpc("recalculate_downstream_tasks", {
    p_task_id: taskId,
    p_new_due_date: newDueDate,
    p_original_due_date: orig,
  });
  if (error) {
    const { error: err2 } = await supabase.rpc("recalculate_downstream_tasks", {
      p_task_id: taskId,
      p_new_due_date: newDueDate,
    });
    if (err2) {
      console.warn("recalculate_downstream_tasks:", err2.message);
    }
  }
}
