/** Seeded reusable templates for the two primary workflows (Business Rules). */
export type TemplateKind = "manage_event" | "project_management";

export const STARTER_TEMPLATE_DEFS: {
  name: string;
  description: string;
  template_kind: TemplateKind;
  tasks: { title: string; description: string }[];
  budgetItems: { category: string; item_name: string; estimated_cost: number }[];
}[] = [
  {
    name: "Host — Manage Event Starter",
    description: "Reusable checklist for Hosts using the Manage Event workflow.",
    template_kind: "manage_event",
    tasks: [
      { title: "Confirm event date and venue basics", description: "Lock date/time and primary location." },
      { title: "Set guest count estimate", description: "Capture expected attendance for planning." },
      { title: "Draft event budget", description: "Enter planned budget and initial line items." },
      { title: "Invite key collaborators", description: "Add hosts/helpers via Communication / Team." },
      { title: "Review timeline milestones", description: "Check Event Timeline for upcoming deadlines." },
    ],
    budgetItems: [
      { category: "venue", item_name: "Venue / space", estimated_cost: 0 },
      { category: "catering", item_name: "Food & beverage", estimated_cost: 0 },
      { category: "misc", item_name: "Contingency", estimated_cost: 0 },
    ],
  },
  {
    name: "Planner — Project Management Starter",
    description: "Reusable checklist for Organizers/Planners using Project Management.",
    template_kind: "project_management",
    tasks: [
      { title: "Define scope and success criteria", description: "Document deliverables and constraints." },
      { title: "Build task assignments by role", description: "Assign Venue, Hospitality, Vendor, Marketing roles." },
      { title: "Establish budget categories", description: "Create budget lines with estimated costs." },
      { title: "Set task dependencies", description: "Order work using Business Rules prerequisites." },
      { title: "Schedule change-request process", description: "Align team on how updates are approved." },
      { title: "Connect vendor / resource directories", description: "Link profiles from directories to the event." },
    ],
    budgetItems: [
      { category: "venue", item_name: "Venue", estimated_cost: 0 },
      { category: "hospitality", item_name: "Hospitality", estimated_cost: 0 },
      { category: "services", item_name: "Service vendors", estimated_cost: 0 },
      { category: "marketing", item_name: "Marketing", estimated_cost: 0 },
      { category: "other", item_name: "Contingency", estimated_cost: 0 },
    ],
  },
];
