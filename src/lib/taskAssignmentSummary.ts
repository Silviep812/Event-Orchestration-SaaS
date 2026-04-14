import {
  getAllItemIdsForTemplate,
  getCollaboratorTemplateForCategory,
} from "@/lib/collaboratorChecklists";

export type TaskAssignmentSummary = {
  prerequisites: string[];
  checklistDone: number;
  checklistTotal: number;
};

/**
 * Derives UI summary for prerequisites (IEP gates) and collaborator checklist progress from `tasks.checklist` JSON.
 */
export function getAssignmentSummaryFromTaskRow(row: {
  category?: string | null;
  checklist?: unknown;
}): TaskAssignmentSummary {
  const raw = row.checklist;
  const obj =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const prereq = Array.isArray(obj.iep_prerequisites)
    ? obj.iep_prerequisites.filter((x): x is string => typeof x === "string")
    : [];
  const cc = obj.collaborator_checklist;
  const map =
    typeof cc === "object" && cc && !Array.isArray(cc) ? (cc as Record<string, boolean>) : {};
  const tmpl = row.category?.trim() ? getCollaboratorTemplateForCategory(row.category) : null;
  const ids = tmpl ? getAllItemIdsForTemplate(tmpl) : [];
  const total = ids.length;
  const done = total === 0 ? 0 : ids.filter((id) => map[id] === true).length;
  return { prerequisites: prereq, checklistDone: done, checklistTotal: total };
}
