/**
 * Task assignment categories and prerequisite gates for task dependencies.
 *
 * Category `value` strings map to `tasks.category` (CSV of assignment types). Prerequisite labels match
 * the dependency menu options; order is preserved. They are stored on tasks as
 * `checklist.iep_prerequisites` (separate from change requests).
 *
 * Collaborator checklist templates live in `collaboratorChecklists.ts` and `tasks.checklist`.
 */

export const TASK_ASSIGNMENT_CATEGORIES = [
  { value: "Bookings", label: "Booking" },
  { value: "Venue", label: "Venue" },
  { value: "Hospitality", label: "Hospitality Provider" },
  { value: "Vendor Service Rental/Buy", label: "Service Rental" },
  { value: "Suppliers", label: "External Vendor" },
  { value: "Vendors", label: "Vendors" },
  { value: "Transportation", label: "Transportation" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Marketing", label: "Marketing" },
] as const;

export type TaskAssignmentCategory = (typeof TASK_ASSIGNMENT_CATEGORIES)[number]["value"];

/**
 * Task dependency prerequisite gates per assignment category.
 * Keys match `TASK_ASSIGNMENT_CATEGORIES[].value` (DB `tasks.category`).
 *
 * Guidelines name "Rent Service Vendor" and "External Vendor (Procurement)" explicitly.
 * "Service Vendor" (security, cleaning, tech, etc.) is distinct from equipment rental.
 */
export const DEPENDENCY_OPTIONS_BY_CATEGORY: Record<string, readonly string[]> = {
  Bookings: ["Event scope finalized", "Budget approval"],
  Venue: ["Booking confirmed", "Plan and budget approved", "Contract signed"],
  Hospitality: ["Amenities confirmed", "Final agenda approved"],
  /** Rent Service Vendor — tables, chairs, rental equipment */
  "Vendor Service Rental/Buy": ["Budget approval", "Rental availability"],
  
  /** External Vendor (Procurement) */
  Suppliers: ["Procurement approved", "Availability confirmed", "Contract signed"],
  Vendors: ["Venue confirmed", "Decision approved", "Contract signed"],
  Transportation: ["Venue access rules", "Schedule finalized", "Contract signed"],
  Entertainment: [
    "Booking confirmed",
    "Requirements approved",
    "Budget approved",
    "Contract signed",
  ],
  Marketing: ["Event details finalized", "Registration system live"],
};

/**
 * Prerequisite labels for the selected assignment category (only). No category → none.
 * Unknown category keys in CSV are ignored (no union fallback of all rules).
 */
export function getDependencyOptionsForCategories(categoryCsv: string | null | undefined): string[] {
  if (!categoryCsv?.trim()) {
    return [];
  }
  const keys = categoryCsv.split(",").map((s) => s.trim()).filter(Boolean);
  const set = new Set<string>();
  for (const k of keys) {
    const opts = DEPENDENCY_OPTIONS_BY_CATEGORY[k];
    if (opts) opts.forEach((o) => set.add(o));
  }
  return Array.from(set);
}

/**
 * Labels from IEP gates that are not recorded on `checklist.iep_prerequisites` (stored checked items only).
 */
export function getMissingIepPrerequisites(
  category: string | null | undefined,
  checklist: unknown,
): string[] {
  const required = getDependencyOptionsForCategories(category);
  if (required.length === 0) return [];
  const raw =
    checklist &&
    typeof checklist === "object" &&
    !Array.isArray(checklist) &&
    Array.isArray((checklist as Record<string, unknown>).iep_prerequisites)
      ? ((checklist as Record<string, unknown>).iep_prerequisites as unknown[])
      : [];
  const confirmed = new Set(
    raw
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  return required.filter((label) => !confirmed.has(label));
}

/**
 * Updates that only adjust due dates, archive flags, or manual coordinator names are allowed without
 * re-checking IEP prerequisites (engine / housekeeping paths).
 */
export function shouldSkipIepPrerequisiteGuard(updates: Record<string, unknown>): boolean {
  const keys = Object.keys(updates).filter((k) => updates[k] !== undefined);
  if (keys.length === 0) return true;
  if (keys.length === 1 && keys[0] === "due_date") return true;
  if (keys.length === 1 && keys[0] === "archived") return true;
  if (keys.length === 1 && keys[0] === "assigned_coordinator_name") return true;
  return false;
}
