import { supabase } from "@/integrations/supabase/client";
import { recalculateDownstreamTasksForDueDateChange, recalculateProjectTimelineForEvent } from "@/lib/projectTimelineRecalc";
import { syncEventResourcesFromSnapshot } from "@/lib/syncEventResourcesFromSnapshot";

function broadcastClientRefresh(eventId: string | null | undefined) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("iep-refetch-tasks"));
  if (eventId) {
    window.dispatchEvent(new CustomEvent("iep-event-updated", { detail: { eventId } }));
  }
}

/**
 * §8-style downstream updates after a change request is applied to an **event** row.
 */
export async function cascadeAfterApprovedEventFieldUpdate(args: {
  eventId: string;
  fieldChanged: string;
}): Promise<void> {
  const { eventId, fieldChanged } = args;
  const field = fieldChanged.trim();
  if (!eventId || !field || field.includes(",")) {
    broadcastClientRefresh(eventId);
    return;
  }

  if (field === "start_date" || field === "end_date") {
    await recalculateProjectTimelineForEvent(eventId);
  }

  if (field === "venue" || field === "location") {
    const { data: ev, error } = await supabase
      .from("events")
      .select("id, venue, location")
      .eq("id", eventId)
      .maybeSingle();
    if (!error && ev) {
      await syncEventResourcesFromSnapshot({
        id: ev.id,
        venue: ev.venue,
        location: ev.location,
      });
    }
  }

  broadcastClientRefresh(eventId);
}

/**
 * Downstream updates after a change request is applied to a **task** row.
 */
export async function cascadeAfterApprovedTaskFieldUpdate(args: {
  eventId: string | null | undefined;
  taskId: string;
  fieldChanged: string;
  newValue: string;
  oldValue?: string | null;
}): Promise<void> {
  const { eventId, taskId, fieldChanged, newValue, oldValue } = args;
  const field = fieldChanged.trim();

  if (field === "due_date") {
    await recalculateDownstreamTasksForDueDateChange({
      taskId,
      newDueDate: newValue,
      originalDueDate: oldValue ?? null,
    });
  }

  if (eventId && (field === "start_date" || field === "end_date")) {
    await recalculateProjectTimelineForEvent(eventId);
  }

  broadcastClientRefresh(eventId ?? undefined);
}
