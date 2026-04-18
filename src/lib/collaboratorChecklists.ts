/**
 * Collaborator checklist templates keyed by assignment category.
 *
 * Item ids are stable (`prefix-s{n}-i{m}`) so persisted `tasks.checklist.collaborator_checklist` survives copy edits.
 */

export type CollaboratorSection = { title: string; items: { id: string; label: string }[] };

export type CollaboratorTemplate = {
  id: string;
  title: string;
  role: string;
  sections: CollaboratorSection[];
};

function sec(prefix: string, sectionIndex: number, sectionTitle: string, labels: string[]): CollaboratorSection {
  const rows = labels ?? [];
  return {
    title: sectionTitle,
    items: rows.map((label, i) => ({
      id: `${prefix}-s${sectionIndex}-i${i}`,
      label,
    })),
  };
}

/** Maps first assignment category value (tasks.category CSV) to template id */
export const CATEGORY_TO_COLLABORATOR_TEMPLATE: Record<string, string> = {
  Bookings: "booking",
  Venue: "venue",
  Hospitality: "hospitality",
  "Vendor Service Rental/Buy": "service_rental",
  "Service Vendor": "service_vendor",
  Suppliers: "external_vendor",
  Vendors: "vendors",
  Transportation: "transportation",
  Entertainment: "entertainment",
  Marketing: "marketing",
};

export const COLLABORATOR_TEMPLATES: Record<string, CollaboratorTemplate> = {
  booking: {
    id: "booking",
    title: "Booking Collaborator Checklist",
    role: "Manages schedules, confirmations, contracts, and deposits",
    sections: [
      sec("booking", 0, "Pre-Booking", [
        "Confirm event date(s), time window, and timezone",
        "Verify event scope (attendees, format, locations)",
        "Identify booking dependencies (venue, vendors, permits)",
        "Request availability from all required parties",
      ]),
      sec("booking", 1, "Booking Execution", [
        "Secure written confirmation (email / platform / contract)",
        "Confirm cancellation and change policies",
        "Collect and log deposits",
        "Upload contracts to event record",
        "Record confirmation numbers / references",
      ]),
      sec("booking", 2, "Post-Booking", [
        "Send confirmation summary to event lead",
        "Add key dates to timeline (cutoff, final count, load-in)",
        "Schedule reminder checkpoints",
        "Flag booking risks or conflicts",
      ]),
    ],
  },
  venue: {
    id: "venue",
    title: "Venue Collaborator Checklist",
    role: "Manages physical location, access, and compliance",
    sections: [
      sec("venue", 0, "Venue Evaluation", [
        "Confirm capacity vs. attendance",
        "Verify layout options (seating, staging, breakout areas)",
        "Review accessibility requirements (ADA, elevators, restrooms)",
        "Confirm parking / transport access",
      ]),
      sec("venue", 1, "Contract & Compliance", [
        "Review venue contract terms",
        "Confirm insurance requirements",
        "Verify permits, licenses, and noise restrictions",
        "Confirm load-in / load-out rules",
      ]),
      sec("venue", 2, "Operational Readiness", [
        "Confirm power, Wi-Fi, HVAC availability",
        "Validate setup / teardown schedule",
        "Coordinate with vendors on access times",
        "Conduct pre-event walk-through",
      ]),
      sec("venue", 3, "Day-Of", [
        "Confirm venue open on schedule",
        "Monitor compliance with venue rules",
        "Serve as venue point-of-contact",
      ]),
    ],
  },
  hospitality: {
    id: "hospitality",
    title: "Hospitality Provider Checklist",
    role: "Food, beverage, guest experience services",
    sections: [
      sec("hospitality", 0, "Planning", [
        "Confirm guest count and dietary requirements",
        "Finalize menu selections",
        "Confirm service style (buffet, plated, stations)",
        "Align service timing with event agenda",
      ]),
      sec("hospitality", 1, "Compliance & Logistics", [
        "Verify food safety certifications",
        "Confirm alcohol permits (if applicable)",
        "Confirm kitchen access and prep space",
        "Finalize staffing plan",
      ]),
      sec("hospitality", 2, "Execution", [
        "Deliver food and beverages on schedule",
        "Confirm presentation standards",
        "Monitor service levels during event",
        "Manage waste and cleanup",
      ]),
      sec("hospitality", 3, "Post-Event", [
        "Confirm final guest count billing",
        "Resolve shortages or overages",
        "Collect feedback",
      ]),
    ],
  },
  service_vendor: {
    id: "service_vendor",
    title: "Service Vendor Checklist",
    role: "Security, cleaning, volunteers, tech, etc.",
    sections: [
      sec("service_vendor", 0, "Pre-Engagement", [
        "Confirm scope of services",
        "Review technical requirements",
        "Validate compatibility with venue",
        "Confirm staffing and equipment needs",
      ]),
      sec("service_vendor", 1, "Contract & Setup", [
        "Finalize service agreement",
        "Confirm setup and teardown windows",
        "Verify power, access, storage needs",
        "Coordinate with venue + other vendors",
      ]),
      sec("service_vendor", 2, "Event Execution", [
        "Arrive on time",
        "Test equipment/services",
        "Remain on standby per SLA",
        "Log issues or adjustments",
      ]),
      sec("service_vendor", 3, "Wrap-Up", [
        "Tear down per schedule",
        "Confirm equipment return",
        "Submit final invoice",
      ]),
    ],
  },
  service_rental: {
    id: "service_rental",
    title: "Service Rental Checklist",
    role: "Controls procurement decisions and cost optimization",
    sections: [
      sec("service_rental", 0, "Assessment", [
        "Identify item purpose and frequency of use",
        "Compare rental vs. purchase cost",
        "Evaluate storage, transport, and maintenance",
        "Assess resale or reuse value",
      ]),
      sec("service_rental", 1, "Decision & Approval", [
        "Confirm budget availability",
        "Obtain approval from event lead",
        "Document decision rationale",
      ]),
      sec("service_rental", 2, "Procurement", [
        "Place rental order or purchase",
        "Confirm delivery and pickup dates",
        "Inspect items upon receipt",
        "Log asset or rental ID",
      ]),
      sec("service_rental", 3, "Post-Event", [
        "Return rentals on time",
        "Inspect for damages",
        "Store or dispose of purchased items",
        "Update asset inventory",
      ]),
    ],
  },
  vendors: {
    id: "vendors",
    title: "Vendors Checklist",
    role: "Provides physical goods, consumables, or materials (non-service)",
    sections: [
      sec("vendors", 0, "Planning & Requirements", [
        "Confirm item specifications and quantities",
        "Validate lead times and minimum order requirements",
        "Confirm branding, labeling, or customization needs",
        "Identify storage and handling requirements",
      ]),
      sec("vendors", 1, "Procurement", [
        "Finalize supplier selection",
        "Confirm pricing and payment terms",
        "Place purchase order",
        "Upload invoices and receipts",
      ]),
      sec("vendors", 2, "Delivery & Quality Control", [
        "Confirm delivery date and location",
        "Inspect items upon arrival",
        "Log shortages, damages, or defects",
        "Coordinate replacements if needed",
      ]),
      sec("vendors", 3, "Post-Event", [
        "Manage returns (if applicable)",
        "Track consumable usage",
        "Archive supplier performance notes",
      ]),
    ],
  },
  entertainment: {
    id: "entertainment",
    title: "Entertainment Collaborator Checklist",
    role: "Manages performers, talent, speakers, or live entertainment",
    sections: [
      sec("entertainment", 0, "Planning & Selection", [
        "Confirm entertainment type and format (band, DJ, speaker, performer, MC)",
        "Validate availability for event date and time window",
        "Confirm performance duration and set structure",
        "Review technical, staging, and space requirements",
        "Confirm audience interaction or content constraints",
      ]),
      sec("entertainment", 1, "Contract & Compliance", [
        "Finalize performance agreement or contract",
        "Confirm payment terms, deposits, and payout schedule",
        "Verify insurance, riders, or liability requirements",
        "Confirm content guidelines and conduct expectations",
      ]),
      sec("entertainment", 2, "Coordination", [
        "Align performance timing with event agenda",
        "Confirm load-in, rehearsal, and soundcheck windows",
        "Coordinate AV, lighting, and backstage needs",
        "Share day-of contact and escalation path",
      ]),
      sec("entertainment", 3, "Event-Day Execution", [
        "Confirm talent arrival and check-in",
        "Complete soundcheck / technical rehearsal",
        "Execute performance as scheduled",
        "Resolve on-site issues or timing adjustments",
      ]),
      sec("entertainment", 4, "Post-Event", [
        "Process final payment",
        "Collect performance feedback",
        "Archive contracts, riders, and notes",
      ]),
    ],
  },
  transportation: {
    id: "transportation",
    title: "Transportation Provider Checklist",
    role: "Manages movement of people, equipment, or materials",
    sections: [
      sec("transportation", 0, "Pre-Planning", [
        "Confirm transport scope (guests, staff, equipment)",
        "Validate pickup and drop-off locations",
        "Confirm schedules and buffer times",
        "Identify accessibility needs",
      ]),
      sec("transportation", 1, "Coordination", [
        "Confirm vehicle types and capacities",
        "Verify licenses, insurance, and compliance",
        "Share routes and contingency plans",
        "Coordinate with venue access rules",
      ]),
      sec("transportation", 2, "Event-Day Execution", [
        "Vehicles arrive on time",
        "Drivers briefed on schedule and contacts",
        "Monitor real-time delays or reroutes",
        "Communicate updates to event team",
      ]),
      sec("transportation", 3, "Post-Event", [
        "Confirm return routes completed",
        "Validate final billing",
        "Log performance issues or delays",
      ]),
    ],
  },
  marketing: {
    id: "marketing",
    title: "Marketing Collaborator Checklist",
    role: "Drives awareness, attendance, and engagement",
    sections: [
      sec("marketing", 0, "Strategy & Planning", [
        "Define target audience",
        "Confirm key messages and branding",
        "Align marketing timeline with event milestones",
        "Set success metrics (registrations, reach, CTR)",
      ]),
      sec("marketing", 1, "Content Creation", [
        "Design promotional assets (graphics, copy, video)",
        "Prepare email campaigns",
        "Draft social media posts",
        "Coordinate approvals",
      ]),
      sec("marketing", 2, "Distribution & Promotion", [
        "Schedule email sends",
        "Publish social posts",
        "Launch paid ads (if applicable)",
        "Coordinate with partners or sponsors",
      ]),
      sec("marketing", 3, "Monitoring & Optimization", [
        "Track registrations and engagement",
        "Adjust campaigns as needed",
        "Respond to inquiries or comments",
      ]),
      sec("marketing", 4, "Post-Event", [
        "Publish recap content",
        "Share thank-you messages",
        "Report performance metrics",
        "Archive assets for reuse",
      ]),
    ],
  },
  external_vendor: {
    id: "external_vendor",
    title: "External Vendor Checklist",
    role: "Third-party providers not covered by core service categories (e.g. photographers, florists, signage, merch, specialty services)",
    sections: [
      sec("external_vendor", 0, "Engagement", [
        "Define scope of work and deliverables",
        "Confirm availability and service window",
        "Validate compatibility with venue rules and layout",
      ]),
      sec("external_vendor", 1, "Contract & Preparation", [
        "Finalize agreement or service terms",
        "Confirm setup and teardown timing",
        "Verify access credentials and load-in requirements",
        "Coordinate with venue and lead vendors",
      ]),
      sec("external_vendor", 2, "Event Execution", [
        "Deliver services or products per scope",
        "Coordinate with event lead as needed",
        "Log deviations, delays, or issues",
      ]),
      sec("external_vendor", 3, "Close-Out", [
        "Confirm all deliverables received",
        "Process final payment",
        "Archive vendor evaluation and performance notes",
      ]),
    ],
  },
};

/** Ordered assignment type values from `tasks.category` CSV (trimmed, non-empty). */
export function parseAssignmentCategoryCsv(categoryCsv: string | null | undefined): string[] {
  return (categoryCsv ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * All collaborator templates for the given assignment CSV (deduped by template id, order preserved).
 * Unknown category tokens (e.g. legacy `Countdown`) are skipped.
 */
export function getCollaboratorTemplatesForCategories(
  categoryCsv: string | null | undefined,
): CollaboratorTemplate[] {
  const parts = parseAssignmentCategoryCsv(categoryCsv);
  const seen = new Set<string>();
  const out: CollaboratorTemplate[] = [];
  for (const p of parts) {
    const key = CATEGORY_TO_COLLABORATOR_TEMPLATE[p];
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const t = COLLABORATOR_TEMPLATES[key];
    if (t) out.push(t);
  }
  return out;
}

/** First matching template only (legacy single-type callers). */
export function getCollaboratorTemplateForCategory(categoryCsv: string | null | undefined): CollaboratorTemplate | null {
  const list = getCollaboratorTemplatesForCategories(categoryCsv);
  return list[0] ?? null;
}

export function getAllItemIdsForTemplate(template: CollaboratorTemplate): string[] {
  const ids: string[] = [];
  for (const s of template.sections) {
    for (const it of s.items) ids.push(it.id);
  }
  return ids;
}

export function isCollaboratorChecklistComplete(
  template: CollaboratorTemplate,
  state: Record<string, boolean> | null | undefined,
): boolean {
  const ids = getAllItemIdsForTemplate(template);
  if (ids.length === 0) return true;
  return ids.every((id) => state?.[id] === true);
}

/** Once the task has been In progress, collaborator checklist is required before Completed when flagged. */
export function canMarkTaskCompleted(args: {
  category: string | null | undefined;
  checklist: Record<string, unknown> | null | undefined;
}): { ok: true } | { ok: false; reason: string } {
  const cl = args.checklist;
  if (!cl?.collaborator_required) return { ok: true };
  const templates = getCollaboratorTemplatesForCategories(args.category ?? null);
  if (templates.length === 0) return { ok: true };
  const done = (cl.collaborator_checklist as Record<string, boolean>) || {};
  for (const template of templates) {
    if (!isCollaboratorChecklistComplete(template, done)) {
      return {
        ok: false,
        reason: `Complete all checklist items for “${template.title}” (and other selected assignment types) before marking this task completed.`,
      };
    }
  }
  return { ok: true };
}

/** Ordered list for Team / Collaborate accordion (localStorage keys use `cl.id::item.id`). */
export const COLLABORATOR_CHECKLISTS: CollaboratorTemplate[] = [
  COLLABORATOR_TEMPLATES.booking,
  COLLABORATOR_TEMPLATES.venue,
  COLLABORATOR_TEMPLATES.hospitality,
  COLLABORATOR_TEMPLATES.service_vendor,
  COLLABORATOR_TEMPLATES.service_rental,
  COLLABORATOR_TEMPLATES.vendors,
  COLLABORATOR_TEMPLATES.entertainment,
  COLLABORATOR_TEMPLATES.transportation,
  COLLABORATOR_TEMPLATES.marketing,
  COLLABORATOR_TEMPLATES.external_vendor,
];

export function storageKeyForCollaboratorChecklists(eventId: string): string {
  return `iep-collaborator-checklists:${eventId}`;
}
