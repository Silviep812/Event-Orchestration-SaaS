export type CalendarEntryKind = "meeting" | "event" | "deadline" | "other";

const MEETING_TITLE = /^\s*\[meeting\]\s*/i;
const DEADLINE_TITLE = /^\s*\[deadline\]\s*/i;

export type EventRowForCalendarKind = {
  title: string;
  status?: string | null;
  event_types?: { name: string | null } | null;
};

/**
 * Derives calendar display kind from title conventions and optional event type name.
 * DB `events` rows do not carry a separate "calendar_kind" column; meetings use `[Meeting]` title prefix.
 */
export function deriveCalendarEntryKind(row: EventRowForCalendarKind): CalendarEntryKind {
  const t = row.title || "";
  if (DEADLINE_TITLE.test(t)) return "deadline";
  if (MEETING_TITLE.test(t)) return "meeting";
  const typeName = (row.event_types?.name || "").toLowerCase();
  if (typeName.includes("meeting") || typeName.includes("briefing")) return "meeting";
  if (typeName.includes("deadline") || typeName.includes("milestone")) return "deadline";
  const st = (row.status || "").toLowerCase();
  if (st.includes("cancel")) return "other";
  return "event";
}

export function stripCalendarKindPrefix(title: string): string {
  return title.replace(MEETING_TITLE, "").replace(DEADLINE_TITLE, "").trim() || title.trim();
}
