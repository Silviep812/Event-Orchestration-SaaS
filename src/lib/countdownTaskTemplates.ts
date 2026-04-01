/**
 * 90 / 60 / 30-day countdown checklist (Deliverable 2 infographic / stakeholder PDF alignment).
 * Due dates are computed from the event start date (days before event).
 */
export type CountdownPhase = "90d" | "60d" | "30d";

export interface CountdownTaskTemplate {
  phase: CountdownPhase;
  title: string;
  description: string;
  /** Calendar days before event start that this item should be due */
  daysBeforeEvent: number;
  priority: "low" | "medium" | "high";
}

export const COUNTDOWN_TASK_TEMPLATES: CountdownTaskTemplate[] = [
  {
    phase: "90d",
    title: "Lock event goals & success metrics",
    description: "Confirm objectives, audience size, and budget guardrails with stakeholders.",
    daysBeforeEvent: 90,
    priority: "high",
  },
  {
    phase: "90d",
    title: "Venue shortlist & site visits",
    description: "Compare venues, availability, and accessibility; hold top 2–3 options.",
    daysBeforeEvent: 88,
    priority: "high",
  },
  {
    phase: "90d",
    title: "Vendor & entertainment sourcing",
    description: "Issue RFQs to key vendors; hold dates for entertainment acts.",
    daysBeforeEvent: 85,
    priority: "medium",
  },
  {
    phase: "60d",
    title: "Confirm venue & major contracts",
    description: "Execute venue agreement, insurance, and payment milestones.",
    daysBeforeEvent: 60,
    priority: "high",
  },
  {
    phase: "60d",
    title: "Finalize catering & dietary plan",
    description: "Menu lock, headcount bands, and allergen workflow.",
    daysBeforeEvent: 58,
    priority: "medium",
  },
  {
    phase: "60d",
    title: "Run-of-show draft",
    description: "First full timeline: load-in, program, AV, teardown.",
    daysBeforeEvent: 56,
    priority: "medium",
  },
  {
    phase: "30d",
    title: "Guest comms & registration cutover",
    description: "Final invite, reminders, and check-in process (QR / list).",
    daysBeforeEvent: 30,
    priority: "high",
  },
  {
    phase: "30d",
    title: "AV & rehearsal schedule",
    description: "Confirm cues, mics, backups, and rehearsal slots.",
    daysBeforeEvent: 28,
    priority: "high",
  },
  {
    phase: "30d",
    title: "Final budget reconciliation",
    description: "Approve last invoices; contingency sign-off.",
    daysBeforeEvent: 25,
    priority: "medium",
  },
  {
    phase: "30d",
    title: "Day-of command roles",
    description: "Named leads for venue, safety, VIP, and comms.",
    daysBeforeEvent: 21,
    priority: "high",
  },
];

export function dueDateIsoDaysBeforeEvent(eventStart: Date, daysBeforeEvent: number): string {
  const d = new Date(eventStart);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysBeforeEvent);
  return d.toISOString();
}
