import { supabase } from "@/integrations/supabase/client";

/**
 * Event organizer + CM event members (same audience as Team Communication Hub sends to).
 */
export async function fetchEventStakeholderRecipientIds(eventId: string): Promise<string[]> {
  const { data: ev, error: evErr } = await supabase.from("events").select("user_id").eq("id", eventId).maybeSingle();
  if (evErr) throw evErr;
  const { data: mems, error: mErr } = await supabase.from("cm_event_members").select("user_id").eq("event_id", eventId);
  if (mErr) throw mErr;
  const ids = new Set<string>();
  if (ev?.user_id) ids.add(ev.user_id);
  (mems || []).forEach((m) => {
    if (m.user_id) ids.add(m.user_id);
  });
  return [...ids];
}

/**
 * In-app notifications for urgent rollout-timed change requests (IEP briefing: manager alerts).
 */
export async function notifyStakeholdersUrgentChangeRequest(params: {
  eventId: string;
  senderId: string;
  requestTitle: string;
  requestDescription: string;
}): Promise<number> {
  const recipients = await fetchEventStakeholderRecipientIds(params.eventId);
  const targets = recipients.filter((id) => id && id !== params.senderId);
  if (targets.length === 0) return 0;

  const title = `URGENT change request: ${params.requestTitle}`.slice(0, 200);
  const message =
    `${params.requestDescription}\n\n` +
    `This request was marked Urgent (IEP rollout timing). Review it in Project Management → Change Management or Manage Event.`.slice(
      0,
      4000,
    );

  const rows = targets.map((recipient_id) => ({
    recipient_id,
    sender_id: params.senderId,
    title,
    message,
    type: "urgent_change_request",
    entity_type: "event" as const,
    entity_id: params.eventId,
    event_id: params.eventId,
    is_read: false,
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) throw error;
  return targets.length;
}
