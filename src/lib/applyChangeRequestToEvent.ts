import { supabase } from "@/integrations/supabase/client";
import {
  cascadeAfterApprovedEventFieldUpdate,
  cascadeAfterApprovedTaskFieldUpdate,
} from "@/lib/cascadeApprovedChangeRequest";
import { getMissingIepPrerequisites } from "@/lib/taskBusinessRules";
import { canMarkTaskCompleted } from "@/lib/collaboratorChecklists";

/** Task fields a coordinator may apply without re-validating IEP gates (dates, copy, hours, names). */
const COORDINATOR_APPLY_IEP_BYPASS_FIELDS = new Set([
  "due_date",
  "start_date",
  "end_date",
  "title",
  "description",
  "estimated_hours",
  "actual_hours",
  "assigned_coordinator_name",
  "assigned_to_display_name",
]);

async function assertApprovedTaskApplyAllowed(
  taskId: string,
  field: string,
  parsedValue: string | number | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (COORDINATOR_APPLY_IEP_BYPASS_FIELDS.has(field)) {
    return { ok: true };
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .select("category, checklist, status")
    .eq("id", taskId)
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!task) return { ok: false, message: "Task not found" };

  const row = task as { category?: string | null; checklist?: unknown; status?: string | null };

  const nextCategory =
    field === "category"
      ? parsedValue != null
        ? String(parsedValue)
        : (row.category ?? null)
      : (row.category ?? null);

  const nextStatus =
    field === "status" && parsedValue != null && String(parsedValue).trim() !== ""
      ? String(parsedValue)
      : (row.status ?? null);

  if (nextStatus === "completed") {
    const gate = canMarkTaskCompleted({
      category: nextCategory,
      checklist: row.checklist as Record<string, unknown> | null,
    });
    if (!gate.ok) {
      return { ok: false, message: 'reason' in gate ? gate.reason : '' };
    }
  }

  const missing = getMissingIepPrerequisites(nextCategory, row.checklist);
  if (missing.length > 0) {
    return {
      ok: false,
      message: `IEP prerequisites incomplete (${missing.length} missing). Update the task in Project Management or reject this change request.`,
    };
  }

  return { ok: true };
}

export type ChangeRequestApplyRow = {
  event_id: string | null;
  field_changed: string | null;
  new_value: string | null;
  /** Prior value when known (e.g. task due date) for downstream timeline RPCs. */
  old_value?: string | null;
  task_id?: string | null;
};

/**
 * When a change request records a field change, applying approval updates the **task** (if task-linked)
 * or the **event** (whitelisted columns). Only whitelisted columns are written for safety.
 *
 * On success, runs cascades (resource sync, project timeline RPC, task dependency dates) via
 * `cascadeApprovedChangeRequest.ts`.
 */
export async function applyChangeRequestToEvent(
  row: ChangeRequestApplyRow,
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

    const applyGate = await assertApprovedTaskApplyAllowed(tid, field, value);
    if (!applyGate.ok) {
      return { ok: false, message: 'message' in applyGate ? applyGate.message : '' };
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

    let taskEventId: string | null = row.event_id;
    if (!taskEventId) {
      const { data: t } = await supabase.from("tasks").select("event_id").eq("id", tid).maybeSingle();
      taskEventId = (t?.event_id as string | null) ?? null;
    }

    await cascadeAfterApprovedTaskFieldUpdate({
      eventId: taskEventId,
      taskId: tid,
      fieldChanged: field,
      newValue: rawStr,
      oldValue: row.old_value,
    });

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

  await cascadeAfterApprovedEventFieldUpdate({
    eventId: row.event_id,
    fieldChanged: field,
  });

  return { ok: true, appliedTo: "event" };
}
