import { supabase } from "@/integrations/supabase/client";

export type TaskAssignmentNotificationInput = {
  recipientId: string;
  senderId?: string | null;
  taskId: string;
  taskTitle: string;
  eventId?: string | null;
  dueDate?: string | null;
};

/**
 * Assigning a task did not raise anything for the assignee, so acceptance testing reported
 * "Receiving auto notifications is also a problem". Writes the in-app notification row that the
 * Notification page and the header bell read. Never throws: a failed notification must not make a
 * saved assignment look like it failed.
 *
 * Email is out of scope here — `send-task-notification` is the estimate-change mailer and takes a
 * different payload (`coordinatorEmails` + `changeDescription`).
 */
export async function notifyTaskAssignee({
  recipientId,
  senderId,
  taskId,
  taskTitle,
  eventId,
  dueDate,
}: TaskAssignmentNotificationInput): Promise<void> {
  if (!recipientId || recipientId === senderId) return;

  const due = dueDate ? new Date(dueDate) : null;
  const dueLabel =
    due && !Number.isNaN(due.getTime())
      ? ` It is due ${due.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}.`
      : "";

  try {
    const { error } = await supabase.from("notifications").insert({
      recipient_id: recipientId,
      sender_id: senderId ?? null,
      type: "task_update",
      title: "New task assigned to you",
      message: `You have been assigned "${taskTitle}".${dueLabel}`,
      entity_type: "task",
      entity_id: taskId,
      event_id: eventId ?? null,
      channel: "in_app",
    });
    if (error) console.warn("notifyTaskAssignee: in-app notification failed", error.message);
  } catch (error) {
    console.warn("notifyTaskAssignee: in-app notification failed", error);
  }
}
