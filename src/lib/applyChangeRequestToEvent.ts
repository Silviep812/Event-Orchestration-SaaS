import { supabase } from "@/integrations/supabase/client";

type Row = {
  event_id: string | null;
  field_changed: string | null;
  new_value: string | null;
  task_id?: string | null;
};

/**
 * When a change request records a field change, applying approval updates the **task** (if task-linked)
 * or the **event** (whitelisted columns). Only whitelisted columns are written for safety.
 */
export async function applyChangeRequestToEvent(
  row: Row,
): Promise<{ ok: boolean; message?: string; appliedTo?: "task" | "event" | "none" }> {
  const field = row.field_changed?.trim();
  if (!field) {
    return { ok: true, appliedTo: "none" };
  }
  const raw = row.new_value;
  if (raw == null || raw === "") {
    return { ok: true, appliedTo: "none" };
  }
  const rawStr = String(raw);

  const taskParsers: Record<string, (v: string) => string | number | null> = {
    title: (v) => v,
    description: (v) => v,
    status: (v) => v,
    priority: (v) => v,
    category: (v) => v,
    assigned_coordinator_name: (v) => v,
    assigned_to_display_name: (v) => v,
    due_date: (v) => v,
    start_date: (v) => v,
    end_date: (v) => v,
    estimated_hours: (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : null;
    },
    actual_hours: (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : null;
    },
  };

  const tid = row.task_id?.trim();
  if (tid && taskParsers[field]) {
    const parse = taskParsers[field];
    const value = parse(rawStr);
    if (value === null && field !== "estimated_hours" && field !== "actual_hours") {
      return { ok: true, appliedTo: "none" };
    }
    const { error } = await supabase
      .from("tasks")
      .update({
        [field]: value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tid);

    if (error) {
      return { ok: false, message: error.message };
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("iep-refetch-tasks"));
    }
    return { ok: true, appliedTo: "task" };
  }

  if (!row.event_id) {
    return { ok: true, appliedTo: "none" };
  }

  const eventParsers: Record<string, (v: string) => string | number | string[] | null> = {
    budget: (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    },
    expected_attendees: (v) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : 0;
    },
    title: (v) => v,
    description: (v) => v,
    venue: (v) => v,
    location: (v) => v,
    start_date: (v) => v,
    end_date: (v) => v,
    start_time: (v) => v,
    end_time: (v) => v,
    status: (v) => v,
    theme_id: (v) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : null;
    },
    type_id: (v) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : null;
    },
    /** JSON array of supplier UUID strings (procurement / external vendors) */
    external_supplier_ids: (v) => {
      try {
        const parsed = JSON.parse(v) as unknown;
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        /* fall through */
      }
      const parts = v.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
      return parts.length ? parts : null;
    },
  };

  const parse = eventParsers[field];
  if (!parse) {
    return { ok: true, appliedTo: "none" };
  }

  const value = parse(rawStr);
  const { error } = await supabase
    .from("events")
    .update({
      [field]: value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.event_id);

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, appliedTo: "event" };
}
