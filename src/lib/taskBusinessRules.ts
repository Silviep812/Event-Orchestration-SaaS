/**
 * Task assignment categories and dependency labels (Business Guidelines PDF).
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

/** Dependency options shown in Add/Edit Task, keyed by primary assignment category */
export const DEPENDENCY_OPTIONS_BY_CATEGORY: Record<string, readonly string[]> = {
  Bookings: ["Event scope finalized", "Budget approval"],
  Venue: ["Booking confirmed", "Plan and budget approved", "Contract signed/Deposit made"],
  Hospitality: ["Amenities confirmed", "Final agenda approved"],
  "Vendor Service Rental/Buy": ["Budget approval", "Rental availability"],
  "Service Vendor": ["Budget approval", "Rental availability"],
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

export function getDependencyOptionsForCategories(categoryCsv: string | null | undefined): string[] {
  if (!categoryCsv?.trim()) {
    return Array.from(new Set(Object.values(DEPENDENCY_OPTIONS_BY_CATEGORY).flat()));
  }
  const keys = categoryCsv.split(",").map((s) => s.trim()).filter(Boolean);
  const set = new Set<string>();
  for (const k of keys) {
    const opts = DEPENDENCY_OPTIONS_BY_CATEGORY[k];
    if (opts) opts.forEach((o) => set.add(o));
  }
  if (set.size === 0) {
    return Array.from(new Set(Object.values(DEPENDENCY_OPTIONS_BY_CATEGORY).flat()));
  }
  return Array.from(set);
}
