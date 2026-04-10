/**
 * Shared rules for “active / past / cancelled / archived” across dashboard and timeline.
 * Cancelled takes precedence over past (a cancelled event is not labeled only as “past”).
 */

export type EventLifecycleInput = {
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  archived?: boolean | null;
};

export type EventLifecycle = {
  /** Raw status with underscores → spaces; empty if no status */
  eventStatusLabel: string;
  isPastEvent: boolean;
  isCancelled: boolean;
  /** In-flight work: not archived, not cancelled, not past, status ∈ active set */
  isActiveEvent: boolean;
  isArchived: boolean;
};

export function computeEventLifecycle(
  event: EventLifecycleInput | null | undefined,
): EventLifecycle | null {
  if (!event) return null;

  const isArchived = !!event.archived;
  const rawEnd = event.end_date || event.start_date;
  const eventEndDate = rawEnd
    ? new Date(String(rawEnd).split("T")[0] + "T12:00:00")
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (eventEndDate) eventEndDate.setHours(0, 0, 0, 0);
  const isPastEvent = eventEndDate ? eventEndDate < today : false;
  const isCancelled = event.status === "cancelled";
  const st = String(event.status || "");
  const isActiveEvent =
    !isArchived &&
    !isPastEvent &&
    !isCancelled &&
    ["pending", "in_progress", "confirmed"].includes(st);

  const eventStatusLabel = event.status
    ? String(event.status).replace(/_/g, " ")
    : "";

  return {
    eventStatusLabel,
    isPastEvent,
    isCancelled,
    isActiveEvent,
    isArchived,
  };
}

/**
 * True when the event window (end date, or start if no end) is strictly before today.
 * For sidebar filters and labels; ignores workflow status (use {@link computeEventLifecycle} for full rules).
 */
export function isEventPastBySchedule(
  event: Pick<EventLifecycleInput, "start_date" | "end_date">,
): boolean {
  const lc = computeEventLifecycle({
    status: null,
    archived: false,
    start_date: event.start_date,
    end_date: event.end_date,
  });
  return lc?.isPastEvent ?? false;
}

export type LifecycleBadgeKind =
  | "archived"
  | "cancelled"
  | "past"
  | "active"
  | "other";

/** Single source for the human-readable label + coarse category (dashboard / table styling). */
export function getLifecycleBadgeParts(event: EventLifecycleInput): {
  label: string;
  kind: LifecycleBadgeKind;
} {
  const lc = computeEventLifecycle(event);
  if (!lc) {
    return { label: "Scheduled", kind: "other" };
  }
  if (lc.isArchived) {
    return { label: "Archived", kind: "archived" };
  }
  if (lc.isCancelled) {
    return { label: "Cancelled", kind: "cancelled" };
  }
  if (lc.isPastEvent) {
    return { label: "Past", kind: "past" };
  }
  if (lc.isActiveEvent) {
    return { label: "Active", kind: "active" };
  }
  const raw = String(event.status || "")
    .replace(/_/g, " ")
    .trim();
  return {
    label: raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Scheduled",
    kind: "other",
  };
}

const KIND_TO_TABLE_VARIANT: Record<
  LifecycleBadgeKind,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  past: "secondary",
  archived: "secondary",
  cancelled: "destructive",
  other: "outline",
};

/** shadcn `Badge` variant for tables (e.g. Reports Event Plan). */
export function getLifecycleTableBadge(event: EventLifecycleInput): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  const { label, kind } = getLifecycleBadgeParts(event);
  return { label, variant: KIND_TO_TABLE_VARIANT[kind] };
}

/** Short lifecycle word for event dropdowns (Project Management, task/budget pickers). */
export function eventSelectLifecycleLabel(event: {
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  archived?: boolean | null;
}): string {
  return getLifecycleTableBadge({
    status: event.status,
    start_date: event.start_date ?? null,
    end_date: event.end_date ?? null,
    archived: event.archived ?? false,
  }).label;
}

/** Styling for the dashboard “Recent Events” pill. */
export function getDashboardRecentEventStatusBadge(event: EventLifecycleInput): {
  label: string;
  className: string;
} {
  const { label, kind } = getLifecycleBadgeParts(event);
  switch (kind) {
    case "archived":
      return { label, className: "bg-muted text-muted-foreground" };
    case "cancelled":
      return { label, className: "bg-destructive text-destructive-foreground" };
    case "past":
      return { label, className: "bg-secondary text-secondary-foreground" };
    case "active":
      return { label, className: "bg-gradient-success text-white" };
    default:
      return {
        label,
        className: "border border-border bg-background text-foreground",
      };
  }
}
