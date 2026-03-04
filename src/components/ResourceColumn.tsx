import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export type ResourceStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface ResourceAssignment {
  selected: boolean;
  status: ResourceStatus;
  confirmed: boolean;
  collaborator_name?: string;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  dependencies?: string[];
  checklist?: ChecklistItem[];
}

// Predefined checklist items per resource category from Business Rules PDF
export const RESOURCE_CHECKLISTS: Record<string, string[]> = {
  Bookings: [
    "Confirm event date(s), time window, and timezone",
    "Verify event scope (attendees, format, locations)",
    "Identify booking dependencies (venue, vendors, permits)",
    "Request availability from all required parties",
    "Secure written confirmation (email / platform / contract)",
    "Confirm cancellation and change policies",
    "Collect and log deposits",
    "Upload contracts to event record",
    "Record confirmation numbers / references",
    "Send confirmation summary to event lead",
    "Add key dates to timeline (cutoff, final count, load-in)",
    "Schedule reminder checkpoints",
    "Flag booking risks or conflicts",
  ],
  Venues: [
    "Confirm capacity vs. attendance",
    "Verify layout options (seating, staging, breakout areas)",
    "Review accessibility requirements (ADA, elevators, restrooms)",
    "Confirm parking / transport access",
    "Review venue contract terms",
    "Confirm insurance requirements",
    "Verify permits, licenses, and noise restrictions",
    "Confirm load-in / load-out rules",
    "Confirm power, Wi-Fi, HVAC availability",
    "Validate setup / teardown schedule",
    "Coordinate with vendors on access times",
    "Confirm venue open on schedule",
    "Monitor compliance with venue rules",
    "Serve as venue point-of-contact",
  ],
  Hospitality: [
    "Confirm guest count and dietary requirements",
    "Finalize menu selections",
    "Confirm service style (buffet, plated, stations)",
    "Align service timing with event agenda",
    "Verify food safety certifications",
    "Confirm alcohol permits (if applicable)",
    "Confirm kitchen access and prep space",
    "Finalize staffing plan",
    "Deliver food and beverages on schedule",
    "Confirm presentation standards",
    "Monitor service levels during event",
    "Manage waste and cleanup",
    "Confirm final guest count billing",
    "Resolve shortages or overages",
    "Collect feedback",
  ],
  "Service Vendor": [
    "Confirm scope of services",
    "Review technical requirements",
    "Validate compatibility with venue",
    "Confirm staffing and equipment needs",
    "Finalize service agreement",
    "Confirm setup and teardown windows",
    "Verify power, access, storage needs",
    "Coordinate with venue + other vendors",
    "Arrive on time",
    "Test equipment/services",
    "Remain on standby per SLA",
    "Log issues or adjustments",
    "Tear down per schedule",
    "Confirm equipment return",
    "Submit final invoice",
  ],
  "Rent or Buy Decision": [
    "Identify item purpose and frequency of use",
    "Compare rental vs. purchase cost",
    "Evaluate storage, transport, and maintenance",
    "Assess resale or reuse value",
    "Confirm budget availability",
    "Obtain approval from event lead",
    "Document decision rationale",
    "Place rental order or purchase",
    "Confirm delivery and pickup dates",
    "Inspect items upon receipt",
    "Log asset or rental ID",
    "Return rentals on time",
    "Inspect for damages",
    "Store or dispose of purchased items",
    "Update asset inventory",
  ],
  Supplier: [
    "Confirm item specifications and quantities",
    "Validate lead times and minimum order requirements",
    "Confirm branding, labeling, or customization needs",
    "Identify storage and handling requirements",
    "Finalize supplier selection",
    "Confirm pricing and payment terms",
    "Place purchase order",
    "Upload invoices and receipts",
    "Confirm delivery date and location",
    "Inspect items upon arrival",
    "Log shortages, damages, or defects",
    "Coordinate replacements if needed",
    "Manage returns (if applicable)",
    "Track consumable usage",
    "Archive supplier performance notes",
  ],
  Entertainment: [
    "Confirm entertainment type and format",
    "Validate availability for event date and time window",
    "Confirm performance duration and set structure",
    "Review technical, staging, and space requirements",
    "Confirm audience interaction or content constraints",
    "Finalize performance agreement or contract",
    "Confirm payment terms, deposits, and payout schedule",
    "Verify insurance, riders, or liability requirements",
    "Confirm content guidelines and conduct expectations",
    "Align performance timing with event agenda",
    "Confirm load-in, rehearsal, and soundcheck windows",
    "Coordinate AV, lighting, and backstage needs",
    "Share day-of contact and escalation path",
    "Confirm talent arrival and check-in",
    "Complete soundcheck / technical rehearsal",
    "Execute performance as scheduled",
    "Resolve on-site issues or timing adjustments",
    "Process final payment",
    "Collect performance feedback",
    "Archive contracts, riders, and notes",
  ],
  Transportation: [
    "Confirm transport scope (guests, staff, equipment)",
    "Validate pickup and drop-off locations",
    "Confirm schedules and buffer times",
    "Identify accessibility needs",
    "Confirm vehicle types and capacities",
    "Verify licenses, insurance, and compliance",
    "Share routes and contingency plans",
    "Coordinate with venue access rules",
    "Vehicles arrive on time",
    "Drivers briefed on schedule and contacts",
    "Monitor real-time delays or reroutes",
    "Communicate updates to event team",
    "Confirm return routes completed",
    "Validate final billing",
    "Log performance issues or delays",
  ],
  Marketing: [
    "Define target audience",
    "Confirm key messages and branding",
    "Align marketing timeline with event milestones",
    "Set success metrics (registrations, reach, CTR)",
    "Design promotional assets (graphics, copy, video)",
    "Prepare email campaigns",
    "Draft social media posts",
    "Coordinate approvals",
    "Schedule email sends",
    "Publish social posts",
    "Launch paid ads (if applicable)",
    "Coordinate with partners or sponsors",
    "Track registrations and engagement",
    "Adjust campaigns as needed",
    "Respond to inquiries or comments",
    "Publish recap content",
    "Share thank-you messages",
    "Report performance metrics",
    "Archive assets for reuse",
  ],
  "External Vendor": [
    "Define scope of work and deliverables",
    "Confirm availability and service window",
    "Validate compatibility with venue rules and layout",
    "Finalize agreement or service terms",
    "Confirm setup and teardown timing",
    "Verify access credentials and load-in requirements",
    "Coordinate with venue and lead vendors",
    "Deliver services or products per scope",
    "Coordinate with event lead as needed",
    "Log deviations, delays, or issues",
    "Confirm all deliverables received",
    "Process final payment",
    "Archive vendor evaluation and performance notes",
  ],
};

export const ROLES = [
  { value: "organizer", label: "Organizer", description: "Organize and coordinate event details" },
  { value: "event_planner", label: "Event Planner", description: "Plan and execute event logistics" },
  { value: "partner", label: "Partner", description: "Collaborate on event planning and execution" },
  { value: "host", label: "Host", description: "Host and manage events" },
  { value: "venue_owner", label: "Venue Owner", description: "Own and manage venue operations" },
  { value: "venue_manager", label: "Venue Manager", description: "Manage venue-related information" },
  { value: "sponsor", label: "Sponsor", description: "Sponsor events and track sponsorship details" },
  { value: "stakeholder", label: "Stakeholder", description: "Stakeholder interested in event data" },
  { value: "collaborator", label: "Collaborator", description: "Collaborate on event tasks" },
];

// Task Dependencies Rules from Business Rules PDF (Rule 9)
export const RESOURCE_DEPENDENCIES: Record<string, string[]> = {
  Bookings: ["Event scope finalized", "Budget approval"],
  Venues: ["Booking confirmed", "Vendor requirements known"],
  Hospitality: ["Amenities confirmed", "Final agenda approved"],
  "Rent or Buy Decision": ["Budget approval", "Rental availability"],
  "External Vendor": ["Procurement decision", "Availability confirmed"],
  Supplier: ["Procurement decision", "Availability confirmed"],
  "Service Vendor": ["Venue Confirmed", "Vendor Decision"],
  Entertainment: ["Booking confirmed", "Entertainment requirements known"],
  Transportation: ["Venue access rules", "Final schedule"],
  Marketing: ["Event details finalized", "Registration system live"],
};

// Generate default checklist for a category
export function getDefaultChecklist(category: string | null | undefined): ChecklistItem[] {
  if (!category || !RESOURCE_CHECKLISTS[category]) return [];
  return RESOURCE_CHECKLISTS[category].map((label, index) => ({
    id: `${category.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${index}`,
    label,
    completed: false,
  }));
}

export const RESOURCE_CATEGORIES = [
  "Bookings",
  "Venues",
  "Hospitality",
  "Service Vendor",
  "Rent or Buy Decision",
  "Supplier",
  "Entertainment",
  "Transportation",
  "Marketing",
  "External Vendor",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const roleColors: Record<string, string> = {
  organizer: "bg-accent/50 text-accent-foreground",
  event_planner: "bg-secondary/50 text-secondary-foreground",
  partner: "bg-primary/10 text-primary",
  host: "bg-primary/20 text-primary",
  venue_owner: "bg-muted text-muted-foreground",
  venue_manager: "bg-muted text-muted-foreground",
  sponsor: "bg-accent/30 text-accent-foreground",
  stakeholder: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
  coordinator: "bg-primary/10 text-primary border-primary/20",
};

export const resourceStatusColors: Record<ResourceStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
};

export const resourceStatusLabels: Record<ResourceStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface ResourceColumnProps {
  category: string;
  assignment: ResourceAssignment;
  onAssignmentChange: (assignment: ResourceAssignment) => void;
  onCollaboratorSave?: (collaboratorName: string) => void;
  onDatesSave?: (dates: {
    due_date?: string;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
  }) => void;
}

export function ResourceColumn({
  category,
  assignment,
  onAssignmentChange,
  onCollaboratorSave,
  onDatesSave,
}: ResourceColumnProps) {
  const [localCollaborator, setLocalCollaborator] = useState(assignment.collaborator_name || "");
  const [localDueDate, setLocalDueDate] = useState(assignment.due_date || "");
  const [localStartDate, setLocalStartDate] = useState(assignment.start_date || "");
  const [localEndDate, setLocalEndDate] = useState(assignment.end_date || "");
  const [localStartTime, setLocalStartTime] = useState(assignment.start_time || "");
  const [localEndTime, setLocalEndTime] = useState(assignment.end_time || "");

  // Sync local state when assignment prop changes
  useEffect(() => {
    setLocalCollaborator(assignment.collaborator_name || "");
    setLocalDueDate(assignment.due_date || "");
    setLocalStartDate(assignment.start_date || "");
    setLocalEndDate(assignment.end_date || "");
    setLocalStartTime(assignment.start_time || "");
    setLocalEndTime(assignment.end_time || "");
  }, [
    assignment.collaborator_name,
    assignment.due_date,
    assignment.start_date,
    assignment.end_date,
    assignment.start_time,
    assignment.end_time,
    category,
  ]);

  const handleCollaboratorSave = () => {
    if (onCollaboratorSave) {
      onCollaboratorSave(localCollaborator);
    } else {
      onAssignmentChange({
        ...assignment,
        collaborator_name: localCollaborator,
      });
    }
  };

  const handleDatesSave = () => {
    const dates = {
      due_date: localDueDate || undefined,
      start_date: localStartDate || undefined,
      end_date: localEndDate || undefined,
      start_time: localStartTime || undefined,
      end_time: localEndTime || undefined,
    };
    if (onDatesSave) {
      onDatesSave(dates);
    } else {
      onAssignmentChange({
        ...assignment,
        ...dates,
      });
    }
  };

  return (
    <div className="min-w-[200px] border rounded-lg p-3 flex-shrink-0 bg-card">
      {/* Column Header - Resource Name with Checkbox */}
      <div className="flex items-center gap-2 border-b pb-2 mb-3">
        <Checkbox
          id={`resource-${category}`}
          checked={assignment.selected}
          onCheckedChange={(checked) => {
            onAssignmentChange({
              ...assignment,
              selected: !!checked,
              status: checked ? assignment.status : "pending",
              confirmed: checked ? assignment.confirmed : false,
              collaborator_name: checked ? assignment.collaborator_name : "",
              due_date: checked ? assignment.due_date : "",
              start_date: checked ? assignment.start_date : "",
              end_date: checked ? assignment.end_date : "",
            });
            if (!checked) {
              setLocalCollaborator("");
              setLocalDueDate("");
              setLocalStartDate("");
              setLocalEndDate("");
            }
          }}
        />
        <label htmlFor={`resource-${category}`} className="text-sm font-semibold leading-none cursor-pointer">
          {category}
        </label>
      </div>

      {/* Status Row */}
      <div className="space-y-1 mb-3">
        <label className="text-xs text-muted-foreground">Status</label>
        <Select
          value={assignment.status}
          onValueChange={(value: ResourceStatus) => {
            onAssignmentChange({
              ...assignment,
              status: value,
            });
          }}
          disabled={!assignment.selected}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border shadow-md z-[100]">
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Confirmation Row - Dropdown */}
      <div className="space-y-1 mb-3">
        <label className="text-xs text-muted-foreground">Confirmation</label>
        <Select
          value={assignment.confirmed ? "yes" : "no"}
          onValueChange={(value) => {
            onAssignmentChange({
              ...assignment,
              confirmed: value === "yes",
            });
          }}
          disabled={!assignment.selected}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Confirmation" />
          </SelectTrigger>
          <SelectContent className="bg-card border shadow-md z-[100]">
            <SelectItem value="yes">Confirmed</SelectItem>
            <SelectItem value="no">Not Confirmed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Assigned To / Collaborator Row */}
      <div className="space-y-1 mb-3">
        <label className="text-xs font-semibold text-foreground">Task Assigned To</label>
        <div className="flex gap-1">
          <Input
            placeholder="Collaborator name"
            value={localCollaborator}
            onChange={(e) => setLocalCollaborator(e.target.value)}
            disabled={!assignment.selected}
            className="h-8 text-xs flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!assignment.selected}
            onClick={handleCollaboratorSave}
            className="h-8 px-2"
          >
            <Save className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Timeline/Dates Row */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Timeline</label>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-10">Due:</span>
            <Input
              type="date"
              value={localDueDate}
              onChange={(e) => setLocalDueDate(e.target.value)}
              disabled={!assignment.selected}
              className="h-7 text-xs flex-1"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-10">Start:</span>
            <Input
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              disabled={!assignment.selected}
              className="h-7 text-xs flex-1"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-10">End:</span>
            <Input
              type="date"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              disabled={!assignment.selected}
              className="h-7 text-xs flex-1"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-10">Start T:</span>
            <Input
              type="time"
              value={localStartTime}
              onChange={(e) => setLocalStartTime(e.target.value)}
              disabled={!assignment.selected}
              className="h-7 text-xs flex-1"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-10">End T:</span>
            <Input
              type="time"
              value={localEndTime}
              onChange={(e) => setLocalEndTime(e.target.value)}
              disabled={!assignment.selected}
              className="h-7 text-xs flex-1"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!assignment.selected}
            onClick={handleDatesSave}
            className="h-7 w-full text-xs mt-1"
          >
            <Save className="h-3 w-3 mr-1" /> Save Timeline
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert string array to ResourceAssignment record
export function convertLegacyToResourceAssignments(collaboratorTypes: string[]): Record<string, ResourceAssignment> {
  const result: Record<string, ResourceAssignment> = {};

  RESOURCE_CATEGORIES.forEach((category) => {
    result[category] = {
      selected: collaboratorTypes.includes(category),
      status: "pending",
      confirmed: false,
      collaborator_name: "",
      due_date: "",
      start_date: "",
      end_date: "",
    };
  });

  return result;
}

// Helper to get initial empty resource assignments
export function getEmptyResourceAssignments(): Record<string, ResourceAssignment> {
  const result: Record<string, ResourceAssignment> = {};

  RESOURCE_CATEGORIES.forEach((category) => {
    result[category] = {
      selected: false,
      status: "pending",
      confirmed: false,
      collaborator_name: "",
      due_date: "",
      start_date: "",
      end_date: "",
      dependencies: [],
      checklist: getDefaultChecklist(category),
    };
  });

  return result;
}

// Helper to convert ResourceAssignment record to array of selected categories (for backward compatibility)
export function getSelectedCategories(assignments: Record<string, ResourceAssignment>): string[] {
  return Object.entries(assignments)
    .filter(([_, assignment]) => assignment.selected)
    .map(([category]) => category);
}
