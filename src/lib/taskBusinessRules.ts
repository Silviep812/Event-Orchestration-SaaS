/**
 * Business guidelines: task assignment types and task-dependency prerequisite gates per category.
 *
 * Prerequisite strings should match your published guidelines (order matters for successful events).
 * Enforced in Task Manager before save (`checklist.iep_prerequisites`), separate from change requests.
 * Collaborator checklists live in `collaboratorChecklists.ts` and Task Manager (`tasks.checklist`).
 */

export const TASK_ASSIGNMENT_CATEGORIES = [
  { value: "Bookings", label: "Bookings" },
  { value: "Venue", label: "Venue" },
  { value: "Hospitality", label: "Hospitality Provider" },
  { value: "Vendor Service Rental/Buy", label: "Rent Service Vendor" },
  { value: "Service Vendor", label: "Service Vendor" },
  { value: "Suppliers", label: "External Vendor" },
  { value: "Vendors", label: "Vendors" },
  { value: "Transportation", label: "Transportation Provider" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Marketing", label: "Marketing" },
] as const;

export type TaskAssignmentCategory = (typeof TASK_ASSIGNMENT_CATEGORIES)[number]["value"];

/**
 * Task dependency prerequisite gates per assignment category.
 * Keys match `TASK_ASSIGNMENT_CATEGORIES[].value` (DB `tasks.category`).
 *
 * Guidelines name "Rent Service Vendor" and "External Vendor (Procurement)" explicitly.
 * "Service Vendor" uses the same gates as Rent Service Vendor until product splits them.
 */
export const DEPENDENCY_OPTIONS_BY_CATEGORY: Record<string, readonly string[]> = {
  Bookings: ["Event scope finalized", "Budget approval"],
  Venue: ["Booking confirmed", "Plan and budget approved", "Contract signed/Deposit made"],
  Hospitality: ["Amenities confirmed", "Final agenda approved"],
  /** Rent Service Vendor */
  "Vendor Service Rental/Buy": ["Budget approval", "Rental availability"],
  /** Same gates as Rent Service Vendor until Vendor Service vs Service Rental are split */
  "Service Vendor": ["Budget approval", "Rental availability"],
  /** External Vendor (Procurement) */
  Suppliers: ["Procurement approved", "Availability confirmed", "Contract signed"],
  Vendors: ["Venue Confirmed", "Vendors Decision/Approved", "Contract signed"],
  Transportation: ["Venue access rules", "Finalize schedule", "Contract signed"],
  Entertainment: [
    "Booking confirmed",
    "Entertainment requirements approved",
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
