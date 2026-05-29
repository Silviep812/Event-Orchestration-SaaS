import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEventFilter } from "@/hooks/useEventFilter";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  User,
  Link,
  Save,
  X,
  MessageSquare,
  LayoutGrid,
  Columns3,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { createTaskSchema } from "@/lib/validation/taskValidation";
import {
  TASK_ASSIGNMENT_CATEGORIES,
  getDependencyOptionsForCategories,
  getMissingIepPrerequisites,
  shouldSkipIepPrerequisiteGuard,
} from "@/lib/taskBusinessRules";
import {
  canMarkTaskCompleted,
  getAllItemIdsForTemplate,
  getCollaboratorTemplatesForCategories,
  parseAssignmentCategoryCsv,
} from "@/lib/collaboratorChecklists";
import { CollaboratorChecklistSection } from "@/components/tasks/CollaboratorChecklistSection";
import { COUNTDOWN_TASK_TEMPLATES, dueDateIsoDaysBeforeEvent } from "@/lib/countdownTaskTemplates";
import { eventSelectLifecycleLabel } from "@/lib/eventStatus";
import { getAssignmentSummaryFromTaskRow } from "@/lib/taskAssignmentSummary";
import { commentsPlannerCopy, plannerSafeErrorToastDescription, plannerToolsCopy } from "@/lib/nudges";
import { recalculateDownstreamTasksForDueDateChange } from "@/lib/projectTimelineRecalc";
import type { FollowUpIssueItem } from "@/lib/followUpIssues";
import { mergeFollowUpIssuesIntoChecklist, parseFollowUpIssuesFromChecklist } from "@/lib/followUpIssues";
import { TaskDiscussionSheet } from "@/components/communications/TaskDiscussionSheet";
import { TaskKanbanBoard, type KanbanTask } from "@/components/tasks/TaskKanbanBoard";
import {
  buildTaskResourceAssignmentsPayload,
  parseTaskResourceAssignments,
} from "@/lib/taskResourceAssignments";

interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  assigned_role?: string;
  assigned_coordinator_name?: string;
  assigned_to_display_name?: string | null;
  /** Optional functional-role notes */
  assigned_bookings_role?: string | null;
  assigned_service_rental_role?: string | null;
  assigned_hospitality_role?: string | null;
  assigned_entertainment_role?: string | null;
  assigned_transportation_role?: string | null;
  assigned_external_vendor_role?: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  event_id?: string;
  dependencies?: string[]; // Array of task IDs this task depends on
  category?: string; // Task category by role type (Bookings, Venue, etc.)
  /** Stored prerequisite labels confirmed for this assignment (`iep_prerequisites`). */
  checklist?: Record<string, unknown> | null;
  /** Event resources linked to this task (`{ links: [{ resource_id, name? }] }`). */
  resource_assignments?: Record<string, unknown> | null;
}

interface AvailableTask {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  assigned_user_id?: string;
  assigned_user_name?: string;
  category?: string;
  event_id?: string | null;
}

interface User {
  userid: string;
  user_name: string;
  contact_name: string;
}

interface TaskManagerProps {
  eventId?: string;
  selectedEventFilter?: string;
  /** Manage Event timeline tab: hide duplicate Add action & inline team-member assign; use PM modal + edit instead. */
  embedInManageEvent?: boolean;
  /** When true, omits the main "Task Management" (or embed) title block; use inside PM Collaborators where the tab is the heading. */
  suppressPrimaryHeading?: boolean;
  /**
   * When true, `?taskId=` on the current route opens the edit dialog for that task after the list loads, then removes
   * the param. Use only on the primary PM Task tab instance — a second TaskManager is mounted on Collaborator.
   */
  openTaskFromSearchParams?: boolean;
}

const statusColors = {
  not_started: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800"
};

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

/** Seeded / legacy default copy still present on some rows — optional admin normalization. */
const LEGACY_TASK_DESCRIPTION_SOURCES = [
  "Assign task responsibilities",
  "Assign coordinator responsibility",
  "Assign tasks to team members",
] as const;
const LEGACY_TASK_DESCRIPTION_TARGET = "Enter team member name";

const statusIcons = {
  not_started: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle2,
  on_hold: AlertCircle,
  cancelled: AlertCircle
};

function hasAtLeastOneCategory(csv: string | undefined): boolean {
  const parts = parseAssignmentCategoryCsv(csv);
  if (parts.length === 0) return false;
  return parts.some((p) => TASK_ASSIGNMENT_CATEGORIES.some((c) => c.value === p));
}

/** Preserve unknown CSV tokens (e.g. legacy types) while reordering known assignment types. */
function buildCategoryCsvFromKnownSelection(
  selectedKnown: Set<string>,
  preservedCsv: string | undefined,
): string {
  const unknown = parseAssignmentCategoryCsv(preservedCsv).filter(
    (p) => !TASK_ASSIGNMENT_CATEGORIES.some((c) => c.value === p),
  );
  const ordered = TASK_ASSIGNMENT_CATEGORIES.map((c) => c.value).filter((v) => selectedKnown.has(v));
  return [...unknown, ...ordered].filter(Boolean).join(",");
}

/** When the user leaves the title blank, derive a readable default from selected assignment types. */
function computeDefaultTaskTitleFromCategories(categoryCsv: string | undefined): string {
  if (!categoryCsv?.trim()) return "";
  const parts = categoryCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  const labels = parts.map((p) => {
    const found = TASK_ASSIGNMENT_CATEGORIES.find((x) => x.value === p);
    return found?.label ?? p;
  });
  return labels.join(" · ");
}

function trimOrNull(s: string | null | undefined): string | null {
  const t = (s ?? "").trim();
  return t ? t : null;
}

function taskCategoryDisplayLabel(category?: string | null): string | null {
  const c = category?.trim();
  if (!c) return null;
  const parts = c.split(",").map((s) => s.trim()).filter(Boolean);
  const labels = parts.map((p) => {
    const found = TASK_ASSIGNMENT_CATEGORIES.find((x) => x.value === p);
    return found?.label ?? p;
  });
  return labels.length ? labels.join(" · ") : null;
}

function parseTaskChecklistJson(raw: Task["checklist"]): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return { ...(raw as Record<string, unknown>) };
}

function mergeTaskChecklistJson(
  existing: Task["checklist"],
  patch: {
    iep_prerequisites?: string[] | null;
    collaborator_checklist?: Record<string, boolean> | null;
    collaborator_required?: boolean | null;
    follow_up_issues?: FollowUpIssueItem[] | null;
  },
): Record<string, unknown> | null {
  const base = parseTaskChecklistJson(existing);
  if (patch.iep_prerequisites !== undefined) {
    if (patch.iep_prerequisites && patch.iep_prerequisites.length > 0) {
      base.iep_prerequisites = patch.iep_prerequisites;
    } else {
      delete base.iep_prerequisites;
    }
  }
  if (patch.collaborator_checklist !== undefined) {
    base.collaborator_checklist = patch.collaborator_checklist || {};
  }
  if (patch.collaborator_required === true) {
    base.collaborator_required = true;
  }
  if (patch.collaborator_required === false) {
    delete base.collaborator_required;
  }
  if (patch.follow_up_issues !== undefined) {
    mergeFollowUpIssuesIntoChecklist(base, patch.follow_up_issues ?? []);
  }
  return Object.keys(base).length > 0 ? base : null;
}

export function TaskManager({
  eventId,
  selectedEventFilter,
  embedInManageEvent,
  suppressPrimaryHeading = false,
  openTaskFromSearchParams = false,
}: TaskManagerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<AvailableTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [shouldPreserveForm, setShouldPreserveForm] = useState(false);
  const [showDependencyDialog, setShowDependencyDialog] = useState(false);
  const [taskForDependencies, setTaskForDependencies] = useState<{ id: string; title: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [dueDateConflictDialog, setDueDateConflictDialog] = useState({
    isOpen: false,
    currentDate: "",
    suggestedDate: "",
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [dependentTasksConflictDialog, setDependentTasksConflictDialog] = useState({
    isOpen: false,
    currentDate: "",
    newDate: "",
    affectedTasks: [] as Array<{id: string, title: string, currentDueDate: string, newDueDate: string}>,
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_user_id: "",
    priority: "medium" as const,
    estimated_hours: "",
    due_date: "",
    start_date: "",
    end_date: "",
    selected_event_id: "",
    dependencies: [] as string[],
    assigned_role: "",
    taskCategory: "",
    assigned_bookings_role: "",
    assigned_service_rental_role: "",
    assigned_hospitality_role: "",
    assigned_entertainment_role: "",
    assigned_transportation_role: "",
    assigned_external_vendor_role: "",
  });
  /** Prerequisite labels → confirmed (create form) */
  const [iepPrerequisitesConfirmed, setIepPrerequisitesConfirmed] = useState<Record<string, boolean>>({});
  /** Prerequisite labels → confirmed (edit dialog) */
  const [editIepConfirmed, setEditIepConfirmed] = useState<Record<string, boolean>>({});
  /** Collaborator checklist item ids → done (edit dialog) */
  const [editCollaboratorChecklist, setEditCollaboratorChecklist] = useState<Record<string, boolean>>({});
  const [editFollowUps, setEditFollowUps] = useState<FollowUpIssueItem[]>([]);
  const [showFollowUpsOnly, setShowFollowUpsOnly] = useState(false);
  /** Event resources + selection for “Assign resources to task” in edit dialog */
  const [eventResourcesForEdit, setEventResourcesForEdit] = useState<Array<{ id: string; name: string }>>([]);
  const [eventResourcesLoading, setEventResourcesLoading] = useState(false);
  const [editResourceLinkIds, setEditResourceLinkIds] = useState<string[]>([]);
  const [createEventResources, setCreateEventResources] = useState<Array<{ id: string; name: string }>>([]);
  const [createEventResourcesLoading, setCreateEventResourcesLoading] = useState(false);
  const [createResourceLinkIds, setCreateResourceLinkIds] = useState<string[]>([]);
  /** Collaborator checklist on Add task (saved with new task) */
  const [createCollaboratorChecklist, setCreateCollaboratorChecklist] = useState<Record<string, boolean>>({});
  const [dependencySearchTerm, setDependencySearchTerm] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [clearFormAfterSave, setClearFormAfterSave] = useState(false);
  const [assigneeDisplayName, setAssigneeDisplayName] = useState("");
  const [editCoordinatorName, setEditCoordinatorName] = useState(""); // For Edit Task dialog
  const [isSavingCoordinatorName, setIsSavingCoordinatorName] = useState(false);
  const [cardCollaboratorInput, setCardCollaboratorInput] = useState<{ [taskId: string]: string }>({});
  const [isSavingCardCollaborator, setIsSavingCardCollaborator] = useState<{ [taskId: string]: boolean }>({});
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isApplyingCountdown, setIsApplyingCountdown] = useState(false);
  const [isMigratingLegacyDescriptions, setIsMigratingLegacyDescriptions] = useState(false);
  const [taskDiscussOpen, setTaskDiscussOpen] = useState(false);
  const [taskDiscussTask, setTaskDiscussTask] = useState<Task | null>(null);
  const [taskBoardLayout, setTaskBoardLayout] = useState<"kanban" | "grid">(() => {
    try {
      const v = localStorage.getItem("taskManagerBoardLayout");
      if (v === "grid" || v === "kanban") return v;
    } catch {
      /* ignore */
    }
    return "kanban";
  });
  useEffect(() => {
    try {
      localStorage.setItem("taskManagerBoardLayout", taskBoardLayout);
    } catch {
      /* ignore */
    }
  }, [taskBoardLayout]);
  const isCreatingTaskRef = useRef(false);
  const { toast } = useToast();
  const { user, userRoles } = useAuth();
  const { events, applyEventFilter } = useEventFilter();

  const resolvedCreateTitle = useMemo(() => {
    const manual = newTask.title.trim();
    if (manual) return manual;
    return computeDefaultTaskTitleFromCategories(newTask.taskCategory);
  }, [newTask.title, newTask.taskCategory]);

  const createTaskValidationPayload = useMemo(
    () => ({
      ...newTask,
      title: resolvedCreateTitle,
      dependencies: [] as string[],
      selected_event_id: eventId || newTask.selected_event_id,
    }),
    [newTask, eventId, resolvedCreateTitle]
  );

  const iepCreateOptions = useMemo(() => {
    const cat = newTask.taskCategory?.trim();
    if (!cat) return [];
    return getDependencyOptionsForCategories(cat);
  }, [newTask.taskCategory]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    iepCreateOptions.forEach((label) => {
      next[label] = false;
    });
    setIepPrerequisitesConfirmed(next);
  }, [newTask.taskCategory]);

  useEffect(() => {
    const templates = getCollaboratorTemplatesForCategories(newTask.taskCategory);
    if (templates.length === 0) {
      setCreateCollaboratorChecklist({});
      return;
    }
    setCreateCollaboratorChecklist((prev) => {
      const next: Record<string, boolean> = {};
      for (const tmpl of templates) {
        for (const id of getAllItemIdsForTemplate(tmpl)) {
          next[id] = prev[id] === true;
        }
      }
      return next;
    });
  }, [newTask.taskCategory]);

  const isCreateTaskFormValid = useMemo(() => {
    if (!hasAtLeastOneCategory(newTask.taskCategory)) return false;
    if (!resolvedCreateTitle.trim()) return false;
    const base = createTaskSchema.safeParse(createTaskValidationPayload).success;
    if (!base) return false;
    if (
      iepCreateOptions.length > 0 &&
      !iepCreateOptions.every((label) => iepPrerequisitesConfirmed[label])
    ) {
      return false;
    }
    return true;
  }, [
    createTaskValidationPayload,
    newTask.taskCategory,
    resolvedCreateTitle,
    iepCreateOptions,
    iepPrerequisitesConfirmed,
  ]);

  /** Task-to-task dependencies are scoped to the same event (ordering within one plan). */
  const dependencyPool = useMemo(() => {
    const anchorEvent =
      selectedTask?.event_id ??
      (taskForDependencies ? tasks.find((t) => t.id === taskForDependencies.id)?.event_id : null) ??
      null;
    if (anchorEvent && selectedEventFilter === "all" && !eventId) {
      return availableTasks.filter((t) => t.event_id === anchorEvent);
    }
    return availableTasks;
  }, [
    availableTasks,
    selectedTask?.event_id,
    taskForDependencies?.id,
    tasks,
    selectedEventFilter,
    eventId,
  ]);

  const visibleTasks = useMemo(() => {
    if (!showFollowUpsOnly) return tasks;
    return tasks.filter((t) =>
      parseFollowUpIssuesFromChecklist(t.checklist).some((i) => i.text.trim() && !i.done),
    );
  }, [tasks, showFollowUpsOnly]);

  useEffect(() => {
    if (!isEditDialogOpen || !selectedTask) return;
    const opts = selectedTask.category?.trim()
      ? getDependencyOptionsForCategories(selectedTask.category)
      : [];
    const raw = selectedTask.checklist as {
      iep_prerequisites?: string[];
      collaborator_checklist?: Record<string, boolean>;
    } | null | undefined;
    const confirmed = new Set(
      Array.isArray(raw?.iep_prerequisites) ? raw.iep_prerequisites : []
    );
    const next: Record<string, boolean> = {};
    opts.forEach((label) => {
      next[label] = confirmed.has(label);
    });
    setEditIepConfirmed(next);
    const cc = raw?.collaborator_checklist;
    setEditCollaboratorChecklist(
      typeof cc === "object" && cc && !Array.isArray(cc) ? { ...cc } : {},
    );
    setEditFollowUps(parseFollowUpIssuesFromChecklist(selectedTask.checklist));
    // Only id + dialog: checklist/category objects change identity often and can cause effect churn.
  }, [isEditDialogOpen, selectedTask?.id]);

  useEffect(() => {
    if (!isEditDialogOpen || !selectedTask?.event_id) {
      setEventResourcesForEdit([]);
      setEditResourceLinkIds([]);
      return;
    }
    const raw = (selectedTask as { resource_assignments?: unknown }).resource_assignments;
    setEditResourceLinkIds(parseTaskResourceAssignments(raw).map((l) => l.resource_id));
    setEventResourcesLoading(true);
    void supabase
      .from("resources")
      .select("id, name")
      .eq("event_id", selectedTask.event_id)
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          console.warn("TaskManager: resources for event", error.message);
          setEventResourcesForEdit([]);
        } else {
          setEventResourcesForEdit(
            (data || []).map((r) => ({ id: r.id, name: (r.name as string)?.trim() || "Resource" })),
          );
        }
        setEventResourcesLoading(false);
      });
  }, [isEditDialogOpen, selectedTask?.id, selectedTask?.event_id]);

  const createFormEventId = eventId || newTask.selected_event_id || null;

  useEffect(() => {
    if (!isCreateDialogOpen || !createFormEventId) {
      setCreateEventResources([]);
      setCreateResourceLinkIds([]);
      return;
    }
    setCreateEventResourcesLoading(true);
    void supabase
      .from("resources")
      .select("id, name")
      .eq("event_id", createFormEventId)
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          console.warn("TaskManager: resources for create form", error.message);
          setCreateEventResources([]);
        } else {
          setCreateEventResources(
            (data || []).map((r) => ({ id: r.id, name: (r.name as string)?.trim() || "Resource" })),
          );
        }
        setCreateEventResourcesLoading(false);
      });
  }, [isCreateDialogOpen, createFormEventId]);

  useEffect(() => {
    setCreateResourceLinkIds([]);
  }, [newTask.selected_event_id, eventId]);

  // Open create-task dialog immediately when routed here with ?openModal=true (do not wait for
  // fetchTasks or strip the URL until close — avoids Strict Mode / async races where no modal appears).
  useLayoutEffect(() => {
    if (searchParams.get("openModal") !== "true") return;

    setIsCreateDialogOpen(true);
    const urlEventId = searchParams.get("eventId");
    const targetEventId = urlEventId || eventId;
    if (targetEventId) {
      setNewTask((prev) => ({ ...prev, selected_event_id: targetEventId }));
    }
  }, [searchParams, eventId]);

  useEffect(() => {
    if (!openTaskFromSearchParams) return;
    if (loading) return;
    const tid = searchParams.get("taskId")?.trim();
    if (!tid) return;
    const task = tasks.find((t) => t.id === tid);
    if (!task) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("taskId");
          return next;
        },
        { replace: true },
      );
      return;
    }
    setSelectedTask(task);
    setSelectedDependencies(task.dependencies || []);
    setIsEditDialogOpen(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("taskId");
        return next;
      },
      { replace: true },
    );
  }, [openTaskFromSearchParams, loading, tasks, searchParams, setSearchParams]);

  useEffect(() => {
    const onRefetchTasks = () => {
      void fetchTasks();
    };
    window.addEventListener("iep-refetch-tasks", onRefetchTasks);
    return () => window.removeEventListener("iep-refetch-tasks", onRefetchTasks);
  }, [eventId, selectedEventFilter]);

  // Realtime: keep all mounted TaskManager instances (Task tab + Collaborator tab) in sync.
  useEffect(() => {
    const evId =
      eventId || (selectedEventFilter && selectedEventFilter !== "all" ? selectedEventFilter : null);
    const channel = supabase
      .channel(`tasks-rt-${evId ?? "all"}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          ...(evId ? { filter: `event_id=eq.${evId}` } : {}),
        },
        () => {
          void fetchTasks();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId, selectedEventFilter]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      await fetchTasks();
      if (!isMounted) return;
      
      // Always fetch all users (not filtered by event)
      await fetchUsers();
      
      if (isMounted) setLoading(false);
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [eventId, selectedEventFilter]);

  const fetchUsers = async () => {
    try {
      // Fetch all users who have any role assigned (not filtered by event)
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id');
      
      if (rolesError) throw rolesError;
      
      let mappedUsers: User[] = [];
      
      if (userRoles && userRoles.length > 0) {
        // Get unique user IDs
        const uniqueUserIds = [...new Set(userRoles.map(role => role.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles_teammate_view')
          .select('user_id, display_name')
          .in('user_id', uniqueUserIds);
        
        if (profilesError) throw profilesError;
        
        mappedUsers = (profilesData || [])
          .filter(profile => profile.display_name !== 'IDA Event Partners')
          .map(profile => ({
            userid: profile.user_id,
            user_name: profile.display_name,
            contact_name: profile.display_name
          }));
      }
      
      // Handle duplicate display names by appending identifier
      const displayNameCounts = new Map<string, number>();
      mappedUsers.forEach(user => {
        const count = displayNameCounts.get(user.user_name) || 0;
        displayNameCounts.set(user.user_name, count + 1);
      });
      
      const displayNameIndices = new Map<string, number>();
      const uniqueUsers = mappedUsers.map(user => {
        if (displayNameCounts.get(user.user_name)! > 1) {
          const index = (displayNameIndices.get(user.user_name) || 0) + 1;
          displayNameIndices.set(user.user_name, index);
          return {
            ...user,
            user_name: `${user.user_name} (${index})`,
            contact_name: `${user.contact_name} (${index})`
          };
        }
        return user;
      });
      
      setUsers(uniqueUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchTasks = async () => {
    try {
      let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (eventId) {
        query = query.eq('event_id', eventId);
      } else if (selectedEventFilter && selectedEventFilter !== "all") {
        query = query.eq('event_id', selectedEventFilter);
      }
      
      // Per business rules: archive is at event level only; never list task-archived rows here.
      query = query.eq("archived", false);
      
      const { data, error } = await query;
      if (error) throw error;
      
      const { data: archivedEv, error: archErr } = await supabase
        .from("events")
        .select("id")
        .eq("archived", true);
      const archivedIds = new Set<string>();
      if (!archErr) (archivedEv || []).forEach((e) => archivedIds.add(e.id));

      const rawTasks = (data || []).filter((t) => !t.event_id || !archivedIds.has(t.event_id));

      const tasksWithDependenciesAndAssignments = await Promise.all(
        rawTasks.map(async (task) => {
          // Fetch dependencies
          const { data: deps } = await supabase
            .from('tasks_dependencies')
            .select('depends_on_task_id')
            .eq('task_id', task.id);

          // User assignment: use tasks.assigned_to (task_assignments may not exist on all deployments)
          let assigned_user_name: string | undefined =
            task.assigned_to_display_name || undefined;
          const assigned_user_id = task.assigned_to || undefined;

          if (assigned_user_id && !assigned_user_name) {
            const { data: profileData } = await supabase
              .from('user_profiles_teammate_view')
              .select('display_name')
              .eq('user_id', assigned_user_id)
              .single();
            assigned_user_name = profileData?.display_name || undefined;
          }
          
          // Get role assignment from task columns
          const roleAssignment =
            task.assigned_venue_role ||
            task.assigned_supplier_vendor_role ||
            task.assigned_service_vendor_role ||
            task.assined_vendor_role ||
            task.assigned_bookings_role ||
            task.assigned_service_rental_role ||
            task.assigned_hospitality_role ||
            task.assigned_entertainment_role ||
            task.assigned_transportation_role ||
            task.assigned_external_vendor_role;
          
          return {
            ...task,
            dependencies: deps?.map(d => d.depends_on_task_id) || [],
            assigned_user_id,
            assigned_user_name,
            assigned_role: roleAssignment,
            assigned_coordinator_name: task.assigned_coordinator_name,
            assigned_to_display_name: task.assigned_to_display_name,
          };
        })
      );
      
      setTasks(tasksWithDependenciesAndAssignments as any);
      
      // Fetch available tasks for dependency selection
      await fetchAvailableTasks();
    } catch (error) {
      toast({
        title: "Error fetching tasks",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableTasks = async () => {
    try {
      let query = supabase
        .from("tasks")
        .select("id, title, status, category, assigned_to, assigned_to_display_name, event_id")
        .eq("archived", false);

      if (eventId) {
        query = query.eq("event_id", eventId);
      } else if (selectedEventFilter && selectedEventFilter !== "all") {
        query = query.eq("event_id", selectedEventFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const tasksWithAssignments = await Promise.all(
        (data || []).map(async (task) => {
          let assigned_user_name: string | undefined = task.assigned_to_display_name || undefined;
          const assigned_user_id = task.assigned_to || undefined;

          if (assigned_user_id && !assigned_user_name) {
            const { data: profileData } = await supabase
              .from("user_profiles_teammate_view")
              .select("display_name")
              .eq("user_id", assigned_user_id)
              .single();
            assigned_user_name = profileData?.display_name || undefined;
          }

          return {
            id: task.id,
            title: task.title,
            status: task.status,
            assigned_user_id,
            assigned_user_name,
            category: task.category,
            event_id: task.event_id ?? null,
          };
        }),
      );

      setAvailableTasks(tasksWithAssignments);
    } catch (error) {
      console.error('Error fetching available tasks:', error);
    }
  };

  const checkCircularDependency = async (taskId: string, dependencyIds: string[]): Promise<boolean> => {
    try {
      // Get all existing dependencies from the database
      const { data: allDependencies, error } = await supabase
        .from('tasks_dependencies')
        .select('task_id, depends_on_task_id');

      if (error) throw error;

      // Create a map of current dependencies (excluding the ones we're about to change)
      const dependencyMap: { [key: string]: string[] } = {};
      allDependencies?.forEach(dep => {
        if (dep.task_id !== taskId) { // Exclude current task's dependencies as we're updating them
          if (!dependencyMap[dep.task_id]) {
            dependencyMap[dep.task_id] = [];
          }
          dependencyMap[dep.task_id].push(dep.depends_on_task_id);
        }
      });

      // Add the new dependencies we want to create
      dependencyMap[taskId] = dependencyIds;

      // Check if any of the new dependencies would create a circular dependency
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const hasCycle = (currentTaskId: string): boolean => {
        if (recursionStack.has(currentTaskId)) {
          return true; // Found a cycle
        }
        if (visited.has(currentTaskId)) {
          return false; // Already processed this node
        }

        visited.add(currentTaskId);
        recursionStack.add(currentTaskId);

        const dependencies = dependencyMap[currentTaskId] || [];
        for (const depId of dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }

        recursionStack.delete(currentTaskId);
        return false;
      };

      // Check for cycles starting from any task
      for (const task of Object.keys(dependencyMap)) {
        visited.clear();
        recursionStack.clear();
        if (hasCycle(task)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking circular dependency:', error);
      return false;
    }
  };

  const saveDependencies = async (taskId: string, dependencyIds: string[]) => {
    try {
      // Check for circular dependencies
      const hasCircularDependency = await checkCircularDependency(taskId, dependencyIds);
      if (hasCircularDependency) {
        throw new Error('Circular dependency detected! This would create a dependency loop between tasks.');
      }

      // First, remove existing dependencies
      await supabase
        .from('tasks_dependencies')
        .delete()
        .eq('task_id', taskId);

      // Then add new dependencies
      if (dependencyIds.length > 0) {
        const dependencies = dependencyIds.map(depId => ({
          task_id: taskId,
          depends_on_task_id: depId
        }));

        const { error } = await supabase
          .from('tasks_dependencies')
          .insert(dependencies);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving dependencies:', error);
      throw error;
    }
  };

  const checkDueDateConflict = async (taskDueDate: string | undefined, dependencyIds: string[]): Promise<{hasConflict: boolean, suggestedDate?: string}> => {
    if (!taskDueDate || dependencyIds.length === 0) {
      return { hasConflict: false };
    }

    try {
      // Get the due dates of all dependency tasks
      const { data: dependencyTasks, error } = await supabase
        .from('tasks')
        .select('id, due_date')
        .in('id', dependencyIds);

      if (error) throw error;

      // Find the latest due date among dependencies
      let latestDependencyDate: Date | null = null;
      for (const depTask of dependencyTasks) {
        if (depTask.due_date) {
          const depDate = new Date(depTask.due_date);
          if (!latestDependencyDate || depDate > latestDependencyDate) {
            latestDependencyDate = depDate;
          }
        }
      }

      if (!latestDependencyDate) {
        return { hasConflict: false };
      }

      const currentTaskDate = new Date(taskDueDate);
      
      // If task due date is before or same as dependency due date, there's a conflict
      if (currentTaskDate <= latestDependencyDate) {
        // Suggest a date 1 day after the latest dependency
        const suggestedDate = new Date(latestDependencyDate);
        suggestedDate.setDate(suggestedDate.getDate() + 1);
        
        return {
          hasConflict: true,
          suggestedDate: suggestedDate.toISOString().split('T')[0]
        };
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('Error checking due date conflict:', error);
      return { hasConflict: false };
    }
  };

  const findDependentTasks = async (taskId: string): Promise<Task[]> => {
    try {
      // Find all task IDs that depend on this task
      const { data: dependentTaskIds, error: depsError } = await supabase
        .from('tasks_dependencies')
        .select('task_id')
        .eq('depends_on_task_id', taskId);

      if (depsError) throw depsError;

      if (!dependentTaskIds || dependentTaskIds.length === 0) {
        return [];
      }

      // Get the actual task details
      const { data: dependentTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('id', dependentTaskIds.map(dep => dep.task_id));

      if (tasksError) throw tasksError;

      return (dependentTasks || []) as any;
    } catch (error) {
      console.error('Error finding dependent tasks:', error);
      return [];
    }
  };

  const checkDependentTasksConflict = async (taskId: string, newDueDate: string): Promise<{hasConflict: boolean, affectedTasks?: Array<{id: string, title: string, currentDueDate: string, newDueDate: string}>}> => {
    try {
      const dependentTasks = await findDependentTasks(taskId);
      
      if (dependentTasks.length === 0) {
        return { hasConflict: false };
      }

      const newDate = new Date(newDueDate);
      const affectedTasks = [];

      for (const task of dependentTasks) {
        if (task.due_date) {
          const taskDueDate = new Date(task.due_date);
          // If dependent task has earlier due date than the new due date
          if (taskDueDate <= newDate) {
            const suggestedDate = new Date(newDate);
            suggestedDate.setDate(suggestedDate.getDate() + 1);
            
            affectedTasks.push({
              id: task.id,
              title: task.title,
              currentDueDate: task.due_date,
              newDueDate: suggestedDate.toISOString().split('T')[0]
            });
          }
        }
      }

      return {
        hasConflict: affectedTasks.length > 0,
        affectedTasks
      };
    } catch (error) {
      console.error('Error checking dependent tasks conflict:', error);
      return { hasConflict: false };
    }
  };

  const handleDependentTasksConflictConfirmation = (
    currentDate: string,
    newDate: string,
    affectedTasks: Array<{id: string, title: string, currentDueDate: string, newDueDate: string}>,
    onConfirm: () => void,
    onCancel: () => void
  ) => {
    setDependentTasksConflictDialog({
      isOpen: true,
      currentDate,
      newDate,
      affectedTasks,
      onConfirm: () => {
        setDependentTasksConflictDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setDependentTasksConflictDialog(prev => ({ ...prev, isOpen: false }));
        onCancel();
      }
    });
  };

  const handleDueDateConflictConfirmation = (
    currentDate: string,
    suggestedDate: string,
    onConfirm: () => void,
    onCancel: () => void
  ) => {
    setDueDateConflictDialog({
      isOpen: true,
      currentDate,
      suggestedDate,
      onConfirm: () => {
        setDueDateConflictDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => {
        setDueDateConflictDialog(prev => ({ ...prev, isOpen: false }));
        onCancel();
      }
    });
  };

  const createTask = async (options?: { skipDependencyDialog?: boolean }) => {
    if (isCreatingTaskRef.current) return;

    const validationResult = createTaskSchema.safeParse(createTaskValidationPayload);

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setValidationErrors(errors);
      const firstMsg = validationResult.error.issues[0]?.message ?? "Please complete the required fields.";
      toast({
        title: "Cannot save task",
        description: firstMsg,
        variant: "destructive",
      });
      return;
    }

    if (!hasAtLeastOneCategory(newTask.taskCategory)) {
      toast({
        title: "Cannot save task",
        description: "Please select a task category.",
        variant: "destructive",
      });
      return;
    }

    if (
      iepCreateOptions.length > 0 &&
      !iepCreateOptions.every((label) => iepPrerequisitesConfirmed[label])
    ) {
      toast({
        title: "Cannot save task",
        description: "Please confirm all prerequisites before saving.",
        variant: "destructive",
      });
      return;
    }

    setValidationErrors({});
    isCreatingTaskRef.current = true;
    setIsCreatingTask(true);
    try {
      await executeCreateTask(undefined, options);
    } finally {
      isCreatingTaskRef.current = false;
      setIsCreatingTask(false);
    }
  };


  const executeCreateTask = async (overrideDueDate?: string, options?: { skipDependencyDialog?: boolean }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const evId = eventId || newTask.selected_event_id || null;
      const manualNameTrim = assigneeDisplayName.trim();
      if (evId && manualNameTrim) {
        const { data: nameClash } = await supabase
          .from("tasks")
          .select("id, title")
          .eq("event_id", evId)
          .eq("assigned_coordinator_name", manualNameTrim)
          .limit(1);
        if (nameClash && nameClash.length > 0) {
          toast({
            title: "Assignee already has a task for this event",
            description: `Use a different name or re-open "${nameClash[0].title}". Only one primary task per assignee name per event.`,
            variant: "destructive",
          });
          return;
        }
      }
      if (evId && newTask.assigned_user_id) {
        const { data: userClash } = await supabase
          .from("tasks")
          .select("id, title")
          .eq("event_id", evId)
          .eq("assigned_to", newTask.assigned_user_id)
          .limit(1);
        if (userClash && userClash.length > 0) {
          toast({
            title: "This team member already has a task for this event",
            description: `Existing: "${userClash[0].title}".`,
            variant: "destructive",
          });
          return;
        }
      }

      const categoryValue = newTask.taskCategory?.trim() || null;
      const iepKeys = categoryValue
        ? getDependencyOptionsForCategories(categoryValue)
        : [];
      if (
        iepKeys.length > 0 &&
        !iepKeys.every((label) => iepPrerequisitesConfirmed[label])
      ) {
        throw new Error("Prerequisites incomplete");
      }
      const checklistPayload: Record<string, unknown> | null = (() => {
        const o: Record<string, unknown> = {};
        if (iepKeys.length > 0) {
          o.iep_prerequisites = iepKeys.filter((k) => iepPrerequisitesConfirmed[k]);
        }
        const templates = categoryValue ? getCollaboratorTemplatesForCategories(categoryValue) : [];
        if (templates.length > 0) {
          const merged: Record<string, boolean> = {};
          for (const tmpl of templates) {
            for (const id of getAllItemIdsForTemplate(tmpl)) {
              merged[id] = createCollaboratorChecklist[id] ?? false;
            }
          }
          o.collaborator_checklist = merged;
        }
        return Object.keys(o).length > 0 ? o : null;
      })();
      const manualName = assigneeDisplayName.trim();
      const pickedUser = newTask.assigned_user_id
        ? users.find((u) => u.userid === newTask.assigned_user_id)
        : null;
      const titleToSave =
        newTask.title.trim() || computeDefaultTaskTitleFromCategories(newTask.taskCategory);
      const createResourcePayload = buildTaskResourceAssignmentsPayload(
        createResourceLinkIds.map((id) => ({
          resource_id: id,
          name: createEventResources.find((r) => r.id === id)?.name,
        })),
      );
      const taskData = {
        title: titleToSave,
        description: newTask.description?.trim() || null,
        priority: newTask.priority as any,
        estimated_hours: newTask.estimated_hours ? parseFloat(newTask.estimated_hours) : null,
        due_date: overrideDueDate || newTask.due_date || null,
        start_date: newTask.start_date?.trim() || null,
        end_date: newTask.end_date?.trim() || null,
        event_id: eventId || newTask.selected_event_id || null,
        created_by: user.id,
        category: categoryValue,
        checklist: (checklistPayload as unknown as Record<string, unknown> | null) ?? null,
        assigned_to: newTask.assigned_user_id || null,
        assigned_coordinator_name: manualName || null,
        assigned_to_display_name: (pickedUser?.user_name ?? manualName) || null,
        resource_assignments: createResourcePayload as Record<string, unknown> | null,
      };

      const { data: createdTask, error } = await supabase
        .from('tasks')
        .insert(taskData as any)
        .select('id')
        .single();

      if (error) throw error;

      // Creation is already logged by DB trigger `log_task_changes` on INSERT.

      if (newTask.assigned_user_id) {
        const assignedUser = users.find((u) => u.userid === newTask.assigned_user_id);
        await supabase.rpc('log_change', {
          p_entity_type: 'task',
          p_entity_id: createdTask.id,
          p_action: 'assigned',
          p_field_name: 'assigned_to',
          p_new_value: assignedUser?.user_name || newTask.assigned_user_id,
          p_description: `Task assigned to ${assignedUser?.user_name || 'user'}`
        });
      }

      // Close dialog and refetch tasks
      setIsCreateDialogOpen(false);
      await fetchTasks();
      await fetchAvailableTasks();
      
      if (options?.skipDependencyDialog) {
        toast({
          title: "Saved",
          description: "Task assignment saved.",
        });
      } else {
        // Open dependency dialog with the new task
        setTaskForDependencies({ id: createdTask.id, title: titleToSave });
        setShouldPreserveForm(true);
        setShowDependencyDialog(true);

        toast({
          title: "Task created",
          description:
            "Prerequisites for this assignment type are saved. Use the next dialog to link task-to-task dependencies (order of work) for this event.",
        });
      }
    } catch (error) {
      const err = error as { message?: string; details?: string; hint?: string; code?: string } | null;
      const baseMsg = err?.message || (error instanceof Error ? error.message : "Failed to create task. Please try again.");
      const extras = [err?.details, err?.hint, err?.code ? `code ${err.code}` : null]
        .filter(Boolean)
        .join(" · ");
      const fullMsg = extras ? `${baseMsg} — ${extras}` : baseMsg;

      toast({
        title: "Error creating task",
        description: fullMsg,
        variant: "destructive",
      });
    }
  };

  const updateTaskAssignment = async (taskId: string, assignedUserId?: string, oldAssignedUserId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get old and new user names for logging
      const oldUser = oldAssignedUserId ? users.find(u => u.userid === oldAssignedUserId) : null;
      const newUser = assignedUserId ? users.find(u => u.userid === assignedUserId) : null;

      const { error } = await supabase
        .from('tasks')
        .update({
          assigned_to: assignedUserId || null,
          assigned_to_display_name: newUser?.user_name || null,
        })
        .eq('id', taskId);

      if (error) throw error;

      // Log assignment change
      if (oldAssignedUserId !== assignedUserId) {
        await supabase.rpc('log_change', {
          p_entity_type: 'task',
          p_entity_id: taskId,
          p_action: 'updated',
          p_field_name: 'assigned_to',
          p_old_value: oldUser?.user_name || (oldAssignedUserId ? 'Unknown User' : 'Unassigned'),
          p_new_value: newUser?.user_name || (assignedUserId ? 'Unknown User' : 'Unassigned'),
          p_description: assignedUserId 
            ? `Task reassigned from ${oldUser?.user_name || 'Unassigned'} to ${newUser?.user_name || 'user'}`
            : `Task unassigned from ${oldUser?.user_name || 'user'}`
        });
      }
    } catch (error) {
      console.error('Error updating task assignment:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
    try {
      // Get the original task for comparison
      const originalTask = tasks.find(t => t.id === taskId);
      
      // Remove assigned_user_id and assigned_user_name from updates as they're handled separately
      const { assigned_user_id, assigned_user_name, ...taskUpdates } = updates;

      let toSend: Partial<Task> = { ...taskUpdates };

      if (taskUpdates.status === "in_progress" && originalTask) {
        const merged = mergeTaskChecklistJson(taskUpdates.checklist ?? originalTask.checklist, {
          collaborator_required: true,
        });
        toSend.checklist = merged as Task["checklist"];
      }

      const assignmentTouched = Object.prototype.hasOwnProperty.call(updates, "assigned_user_id");
      const skipIep =
        shouldSkipIepPrerequisiteGuard(taskUpdates as Record<string, unknown>) && !assignmentTouched;

      if (originalTask && !skipIep) {
        const effCategory =
          toSend.category !== undefined ? toSend.category : originalTask.category;
        const effChecklist =
          toSend.checklist !== undefined ? toSend.checklist : originalTask.checklist;
        const missing = getMissingIepPrerequisites(effCategory, effChecklist);
        if (missing.length > 0) {
          toast({
            title: "Prerequisites incomplete",
            description: `Confirm all prerequisite items for this assignment type before saving (${missing.length} missing). Open the task to edit and check every prerequisite box, or complete them from the task list.`,
            variant: "destructive",
          });
          return false;
        }
      }

      if (
        assignmentTouched &&
        assigned_user_id &&
        originalTask?.event_id
      ) {
        const { data: userClash } = await supabase
          .from("tasks")
          .select("id, title")
          .eq("event_id", originalTask.event_id)
          .eq("assigned_to", assigned_user_id)
          .neq("id", taskId)
          .limit(1);
        if (userClash && userClash.length > 0) {
          toast({
            title: "This team member already has a task for this event",
            description: `Existing: "${userClash[0].title}". Only one primary task per assigned user per event.`,
            variant: "destructive",
          });
          return false;
        }
      }

      const coordIncoming =
        toSend.assigned_coordinator_name !== undefined
          ? String(toSend.assigned_coordinator_name ?? "").trim() || null
          : undefined;
      if (
        coordIncoming &&
        originalTask?.event_id &&
        coordIncoming !== (originalTask.assigned_coordinator_name ?? "").trim()
      ) {
        const { data: nameClash } = await supabase
          .from("tasks")
          .select("id, title")
          .eq("event_id", originalTask.event_id)
          .eq("assigned_coordinator_name", coordIncoming)
          .neq("id", taskId)
          .limit(1);
        if (nameClash && nameClash.length > 0) {
          toast({
            title: "Assignee already has a task for this event",
            description: `Use a different name or open "${nameClash[0].title}". Only one primary task per assignee name per event.`,
            variant: "destructive",
          });
          return false;
        }
      }

      if (taskUpdates.status === "completed" && originalTask) {
        const previewChecklist = (toSend.checklist ?? taskUpdates.checklist ?? originalTask.checklist) as Task["checklist"];
        const gate = canMarkTaskCompleted({
          category: updates.category ?? originalTask.category,
          checklist: previewChecklist as Record<string, unknown> | null,
        });
        if (!gate.ok) {
          toast({
            title: "Collaborator checklist incomplete",
            description: 'reason' in gate ? gate.reason : '',
            variant: "destructive",
          });
          return false;
        }
      }
      
      const { error } = await supabase
        .from('tasks')
        .update(toSend as any)
        .eq('id', taskId);

      if (error) throw error;

      if (
        originalTask &&
        toSend.due_date !== undefined &&
        toSend.due_date !== originalTask.due_date &&
        toSend.due_date
      ) {
        await recalculateDownstreamTasksForDueDateChange({
          taskId,
          newDueDate: String(toSend.due_date),
          originalDueDate: originalTask.due_date ?? null,
        });
      }

      // Log field changes
      if (originalTask) {
        const changes: Array<{field: string, oldValue: any, newValue: any}> = [];
        
        if (updates.title && updates.title !== originalTask.title) {
          changes.push({ field: 'title', oldValue: originalTask.title, newValue: updates.title });
        }
        if (updates.description !== undefined && updates.description !== originalTask.description) {
          changes.push({ field: 'description', oldValue: originalTask.description || 'None', newValue: updates.description || 'None' });
        }
        if (updates.status && updates.status !== originalTask.status) {
          changes.push({ field: 'status', oldValue: originalTask.status, newValue: updates.status });
        }
        if (updates.priority && updates.priority !== originalTask.priority) {
          changes.push({ field: 'priority', oldValue: originalTask.priority, newValue: updates.priority });
        }
        if (updates.estimated_hours !== undefined && updates.estimated_hours !== originalTask.estimated_hours) {
          changes.push({ field: 'estimated_hours', oldValue: originalTask.estimated_hours?.toString() || 'None', newValue: updates.estimated_hours?.toString() || 'None' });
        }
        if (updates.due_date !== undefined && updates.due_date !== originalTask.due_date) {
          changes.push({ field: 'due_date', oldValue: originalTask.due_date || 'None', newValue: updates.due_date || 'None' });
        }
        if (updates.category !== undefined && updates.category !== originalTask.category) {
          changes.push({ field: 'category', oldValue: originalTask.category || 'None', newValue: updates.category || 'None' });
        }

        // Log each change
        for (const change of changes) {
          await supabase.rpc('log_change', {
            p_entity_type: 'task',
            p_entity_id: taskId,
            p_action: 'updated',
            p_field_name: change.field,
            p_old_value: String(change.oldValue),
            p_new_value: String(change.newValue),
            p_description: `Updated ${change.field} from "${change.oldValue}" to "${change.newValue}"`
          });
        }
      }

      // Handle user assignment if provided
      if (assigned_user_id !== undefined) {
        await updateTaskAssignment(taskId, assigned_user_id, originalTask?.assigned_user_id);
      }

      setTasks(tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates, ...toSend } : task,
      ));

      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error updating task",
        description: "Failed to update task.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    
    // Check for due date conflicts with dependencies first
    if (selectedTask.due_date && selectedDependencies.length > 0) {
      const conflict = await checkDueDateConflict(selectedTask.due_date, selectedDependencies);
      if (conflict.hasConflict && conflict.suggestedDate) {
        handleDueDateConflictConfirmation(
          selectedTask.due_date,
          conflict.suggestedDate,
          () => {
            // User confirmed, update due date and continue
            const updatedTask = { ...selectedTask, due_date: conflict.suggestedDate };
            setSelectedTask(updatedTask);
            executeUpdateTask(updatedTask, conflict.suggestedDate);
          },
          () => {
            // User cancelled, do nothing
            return;
          }
        );
        return;
      }
    }

    // Check if updating this task's due date affects dependent tasks
    if (selectedTask.due_date) {
      const dependentConflict = await checkDependentTasksConflict(selectedTask.id, selectedTask.due_date);
      if (dependentConflict.hasConflict && dependentConflict.affectedTasks) {
        handleDependentTasksConflictConfirmation(
          selectedTask.due_date,
          selectedTask.due_date,
          dependentConflict.affectedTasks,
          () => {
            // User confirmed, update task and dependent tasks
            executeUpdateTaskWithDependents(selectedTask, dependentConflict.affectedTasks);
          },
          () => {
            // User cancelled, do nothing
            return;
          }
        );
        return;
      }
    }

    executeUpdateTask(selectedTask);
  };

  const executeUpdateTaskWithDependents = async (
    taskToUpdate: Task, 
    affectedTasks: Array<{id: string, title: string, currentDueDate: string, newDueDate: string}>
  ) => {
    try {
      const catTrim = taskToUpdate.category?.trim();
      const iepOpts = catTrim ? getDependencyOptionsForCategories(catTrim) : [];
      if (iepOpts.length > 0 && !iepOpts.every((label) => editIepConfirmed[label])) {
        toast({
          title: "Prerequisites",
          description: "Check all items",
          variant: "destructive",
        });
        return;
      }
      const checklistUpdate = mergeTaskChecklistJson(taskToUpdate.checklist, {
        iep_prerequisites: iepOpts.length ? iepOpts.filter((label) => editIepConfirmed[label]) : undefined,
        collaborator_checklist: editCollaboratorChecklist,
        collaborator_required: ["in_progress", "on_hold", "completed"].includes(taskToUpdate.status)
          ? true
          : false,
        follow_up_issues: editFollowUps.filter((i) => i.text.trim() || i.done),
      });
      if (taskToUpdate.status === "completed") {
        const gate = canMarkTaskCompleted({
          category: taskToUpdate.category,
          checklist: checklistUpdate,
        });
        if (!gate.ok) {
          toast({ title: "Cannot complete task", description: 'reason' in gate ? gate.reason : '', variant: "destructive" });
          return;
        }
      }
      // Update the main task first
      const resourceLinks = editResourceLinkIds.map((id) => ({
        resource_id: id,
        name: eventResourcesForEdit.find((r) => r.id === id)?.name,
      }));
      const resource_assignments = buildTaskResourceAssignmentsPayload(resourceLinks);

      const mainOk = await updateTask(taskToUpdate.id, {
        title: taskToUpdate.title,
        description: taskToUpdate.description,
        priority: taskToUpdate.priority,
        assigned_user_id: taskToUpdate.assigned_user_id,
        estimated_hours: taskToUpdate.estimated_hours,
        due_date: taskToUpdate.due_date,
        category: taskToUpdate.category,
        status: taskToUpdate.status,
        checklist: checklistUpdate as Task["checklist"],
        assigned_bookings_role: trimOrNull(taskToUpdate.assigned_bookings_role ?? undefined),
        assigned_service_rental_role: trimOrNull(taskToUpdate.assigned_service_rental_role ?? undefined),
        assigned_hospitality_role: trimOrNull(taskToUpdate.assigned_hospitality_role ?? undefined),
        assigned_entertainment_role: trimOrNull(taskToUpdate.assigned_entertainment_role ?? undefined),
        assigned_transportation_role: trimOrNull(taskToUpdate.assigned_transportation_role ?? undefined),
        assigned_external_vendor_role: trimOrNull(taskToUpdate.assigned_external_vendor_role ?? undefined),
        resource_assignments: resource_assignments as Task["resource_assignments"],
      });
      if (!mainOk) return;

      // Update dependent tasks' due dates
      for (const affectedTask of affectedTasks) {
        await updateTask(affectedTask.id, {
          due_date: affectedTask.newDueDate
        });
      }

      // Save dependencies
      if (selectedDependencies.length !== (taskToUpdate.dependencies?.length || 0) || 
          !selectedDependencies.every(dep => taskToUpdate.dependencies?.includes(dep))) {
        await saveDependencies(taskToUpdate.id, selectedDependencies);
      }

      toast({
        title: "Tasks updated",
        description: `Updated main task and ${affectedTasks.length} dependent task${affectedTasks.length > 1 ? 's' : ''}.`,
      });

      setIsEditDialogOpen(false);
      setSelectedTask(null);
      setSelectedDependencies([]);
      fetchTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update tasks. Please try again.";
      const isCircularDependency = errorMessage.includes("Circular dependency detected");
      
      toast({
        title: "Error updating tasks",
        description: isCircularDependency ? errorMessage : "Failed to update tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  const executeUpdateTask = async (taskToUpdate: Task, overrideDueDate?: string) => {
    try {
      const catTrim = taskToUpdate.category?.trim();
      const iepOpts = catTrim ? getDependencyOptionsForCategories(catTrim) : [];
      if (iepOpts.length > 0 && !iepOpts.every((label) => editIepConfirmed[label])) {
        toast({
          title: "Prerequisites",
          description: "Check all items",
          variant: "destructive",
        });
        return;
      }
      const checklistUpdate = mergeTaskChecklistJson(taskToUpdate.checklist, {
        iep_prerequisites: iepOpts.length ? iepOpts.filter((label) => editIepConfirmed[label]) : undefined,
        collaborator_checklist: editCollaboratorChecklist,
        collaborator_required: ["in_progress", "on_hold", "completed"].includes(taskToUpdate.status)
          ? true
          : false,
        follow_up_issues: editFollowUps.filter((i) => i.text.trim() || i.done),
      });
      if (taskToUpdate.status === "completed") {
        const gate = canMarkTaskCompleted({
          category: taskToUpdate.category,
          checklist: checklistUpdate,
        });
        if (!gate.ok) {
          toast({ title: "Cannot complete task", description: 'reason' in gate ? gate.reason : '', variant: "destructive" });
          return;
        }
      }
      const resourceLinks = editResourceLinkIds.map((id) => ({
        resource_id: id,
        name: eventResourcesForEdit.find((r) => r.id === id)?.name,
      }));
      const resource_assignments = buildTaskResourceAssignmentsPayload(resourceLinks);

      const saved = await updateTask(taskToUpdate.id, {
        title: taskToUpdate.title,
        description: taskToUpdate.description,
        priority: taskToUpdate.priority,
        assigned_user_id: taskToUpdate.assigned_user_id,
        estimated_hours: taskToUpdate.estimated_hours,
        due_date: overrideDueDate || taskToUpdate.due_date,
        category: taskToUpdate.category,
        status: taskToUpdate.status,
        checklist: checklistUpdate as Task["checklist"],
        assigned_bookings_role: trimOrNull(taskToUpdate.assigned_bookings_role ?? undefined),
        assigned_service_rental_role: trimOrNull(taskToUpdate.assigned_service_rental_role ?? undefined),
        assigned_hospitality_role: trimOrNull(taskToUpdate.assigned_hospitality_role ?? undefined),
        assigned_entertainment_role: trimOrNull(taskToUpdate.assigned_entertainment_role ?? undefined),
        assigned_transportation_role: trimOrNull(taskToUpdate.assigned_transportation_role ?? undefined),
        assigned_external_vendor_role: trimOrNull(taskToUpdate.assigned_external_vendor_role ?? undefined),
        resource_assignments: resource_assignments as Task["resource_assignments"],
      });
      if (!saved) return;

      // Save dependencies
      if (selectedDependencies.length !== (taskToUpdate.dependencies?.length || 0) || 
          !selectedDependencies.every(dep => taskToUpdate.dependencies?.includes(dep))) {
        await saveDependencies(taskToUpdate.id, selectedDependencies);
      }

      setIsEditDialogOpen(false);
      setSelectedTask(null);
      setSelectedDependencies([]);
      fetchTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update task. Please try again.";
      const isCircularDependency = errorMessage.includes("Circular dependency detected");
      
      toast({
        title: "Error updating task",
        description: isCircularDependency ? errorMessage : "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const effectiveEventIdForCountdown = searchParams.get("eventId") || eventId || "";

  const applyCountdownChecklist = async () => {
    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "You must be signed in to add tasks.",
        variant: "destructive",
      });
      return;
    }
    if (!effectiveEventIdForCountdown) {
      toast({
        title: "Select an event",
        description: plannerToolsCopy.taskSelectEventHint,
        variant: "destructive",
      });
      return;
    }
    setIsApplyingCountdown(true);
    try {
      const { data: ev, error: evErr } = await supabase
        .from("events")
        .select("start_date")
        .eq("id", effectiveEventIdForCountdown)
        .single();
      if (evErr) {
        toast({
          title: "Could not load event",
          description: plannerSafeErrorToastDescription(evErr, commentsPlannerCopy.toastGeneric),
          variant: "destructive",
        });
        return;
      }
      if (!ev?.start_date) {
        toast({
          title: "Event date required",
          description: "Set the event start date on the event before applying the 90/60/30 checklist.",
          variant: "destructive",
        });
        return;
      }
      const start = new Date(ev.start_date as string);
      if (Number.isNaN(start.getTime())) {
        toast({
          title: "Invalid event date",
          description: "Update the event with a valid start date and try again.",
          variant: "destructive",
        });
        return;
      }
      const rows = COUNTDOWN_TASK_TEMPLATES.map((t) => ({
        title: `[${t.phase}] ${t.title}`,
        description: t.description,
        due_date: dueDateIsoDaysBeforeEvent(start, t.daysBeforeEvent),
        priority: t.priority,
        status: "not_started" as const,
        event_id: effectiveEventIdForCountdown,
        created_by: user.id,
        category: "Countdown",
        archived: false,
      }));
      const { error: insErr } = await supabase.from("tasks").insert(rows);
      if (insErr) throw insErr;
      await fetchTasks();
      await fetchAvailableTasks();
      toast({
        title: "Countdown checklist added",
        description: `${COUNTDOWN_TASK_TEMPLATES.length} tasks were created with due dates before your event.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not add checklist",
        description: plannerSafeErrorToastDescription(e, commentsPlannerCopy.toastGeneric),
        variant: "destructive",
      });
    } finally {
      setIsApplyingCountdown(false);
    }
  };

  /** Admin-only: align old default task descriptions with current assignee wording (client data cleanup). */
  const migrateLegacyTaskDescriptions = async () => {
    if (!user?.id) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    const ok = window.confirm(
      "Normalize legacy task descriptions?\n\n" +
        "Any tasks whose description is still the old default (assign responsibilities / coordinator) will be updated to:\n" +
        `"${LEGACY_TASK_DESCRIPTION_TARGET}"\n\n` +
        "Applies to rows your account can update. Continue?",
    );
    if (!ok) return;
    setIsMigratingLegacyDescriptions(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ description: LEGACY_TASK_DESCRIPTION_TARGET })
        .in("description", [...LEGACY_TASK_DESCRIPTION_SOURCES]);

      if (error) throw error;

      toast({
        title: "Descriptions normalized",
        description: "Legacy default copy was updated where it matched.",
      });
      await fetchTasks();
      await fetchAvailableTasks();
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not update descriptions",
        description: plannerSafeErrorToastDescription(e, commentsPlannerCopy.toastGeneric),
        variant: "destructive",
      });
    } finally {
      setIsMigratingLegacyDescriptions(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading tasks...</div>;
  }

  const changelogEventId =
    searchParams.get("eventId") ||
    eventId ||
    (selectedEventFilter && selectedEventFilter !== "all" ? selectedEventFilter : "");

  const embedTaskListScoped = Boolean(
    eventId || (selectedEventFilter && selectedEventFilter !== "all"),
  );

  return (
    <div className="space-y-6">
      {!embedInManageEvent && changelogEventId ? (
        <p className="text-sm text-muted-foreground">
          For a running list of what changed on this event, open{" "}
          <RouterLink
            to={`/dashboard/manage-event?eventId=${changelogEventId}`}
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Manage Event
          </RouterLink>{" "}
          and use <strong>Change Log</strong>.
        </p>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          {!suppressPrimaryHeading ? (
            <>
              <h2 className="text-2xl font-bold">
                {embedInManageEvent
                  ? embedTaskListScoped
                    ? "Tasks for this event"
                    : "Task assignments"
                  : "Task Management"}
              </h2>
              {!embedInManageEvent ? (
                <p className="text-xs text-muted-foreground max-w-xl">
                  Task Manager (Kanban + checklist): drag between <strong>To Do</strong>, <strong>In Progress</strong>,
                  and <strong>Completed</strong>, or switch to <strong>Grid</strong> for the classic card layout.
                  Checklists in Edit combine auto template items with manual follow-ups. Archiving is at the{" "}
                  <strong>event</strong> level (Manage Event), not per task.
                </p>
              ) : null}
            </>
          ) : null}
          <div className={`flex flex-wrap items-center gap-2 ${suppressPrimaryHeading ? "pt-0" : "pt-2"}`}>
            <Button
              variant="secondary"
              onClick={applyCountdownChecklist}
              disabled={!effectiveEventIdForCountdown || isApplyingCountdown}
              className="flex items-center gap-2 text-xs"
              title="Add standard reminder tasks 90, 60, and 30 days before the event start date"
            >
              <Calendar className="h-4 w-4" />
              {isApplyingCountdown ? "Adding…" : "90 / 60 / 30 day reminders"}
            </Button>
            {!embedInManageEvent && userRoles.includes("admin") ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isMigratingLegacyDescriptions}
                className="text-xs"
                title="Admin: replace old default task descriptions with current assignee wording"
                onClick={() => void migrateLegacyTaskDescriptions()}
              >
                {isMigratingLegacyDescriptions ? "Updating…" : "Normalize legacy task descriptions"}
              </Button>
            ) : null}
            <div className="flex rounded-md border border-border bg-muted/30 p-0.5">
              <Button
                type="button"
                variant={taskBoardLayout === "kanban" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1 px-2 text-xs"
                onClick={() => setTaskBoardLayout("kanban")}
                title="Kanban columns"
              >
                <Columns3 className="h-3.5 w-3.5" />
                Kanban
              </Button>
              <Button
                type="button"
                variant={taskBoardLayout === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1 px-2 text-xs"
                onClick={() => setTaskBoardLayout("grid")}
                title="Card grid"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grid
              </Button>
            </div>
          </div>
        </div>
        {!embedInManageEvent ? (
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          if (!open) {
            // Only clear validation errors and search term when closing
            setDependencySearchTerm("");
            setValidationErrors({});
            setCreateResourceLinkIds([]);
            setSearchParams(
              (prev) => {
                const next = new URLSearchParams(prev);
                next.delete("openModal");
                return next;
              },
              { replace: true }
            );
          }
          setIsCreateDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add task assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add task assignment</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 w-full items-start">
              {/* Left: task identity, schedule, assignee — single copy of each field */}
              <div className="space-y-4 min-w-0">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Task details</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Title, timing, and assignee. Assignment types and collaborator checklists are only in the column on
                    the right — nothing duplicated here.
                  </p>
                </div>
                {!eventId && events.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="event">Select Project/Event *</Label>
                    <Select
                      value={
                        events.some((e) => e.id === newTask.selected_event_id)
                          ? newTask.selected_event_id
                          : "__none__"
                      }
                      onValueChange={(value) => {
                        if (value === "__none__") return;
                        setNewTask({ ...newTask, selected_event_id: value, assigned_user_id: "" });
                        setValidationErrors({ ...validationErrors, selected_event_id: "" });
                      }}
                    >
                      <SelectTrigger className={validationErrors.selected_event_id ? "border-destructive" : ""}>
                        <SelectValue placeholder="Choose a project/event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Choose a project/event</SelectItem>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title}
                            {event.start_date &&
                              ` (${format(new Date(event.start_date), "MMM d, yyyy")})`}
                            <span className="text-muted-foreground">{` · ${eventSelectLifecycleLabel(event)}`}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.selected_event_id && (
                      <p className="text-sm text-destructive">{validationErrors.selected_event_id}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Task title *</Label>
                  <p className="text-xs text-muted-foreground">
                    Optional override — if empty, the title defaults to the selected types (e.g. Venue · Marketing).
                  </p>
                  <Input
                    id="title"
                    placeholder="Override title (optional)"
                    value={newTask.title}
                    onChange={(e) => {
                      setNewTask({ ...newTask, title: e.target.value });
                      setValidationErrors({ ...validationErrors, title: "" });
                    }}
                    maxLength={200}
                    className={validationErrors.title ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">{newTask.title.length}/200 characters</p>
                  {validationErrors.title && (
                    <p className="text-sm text-destructive">{validationErrors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter task description"
                    value={newTask.description}
                    onChange={(e) => {
                      setNewTask({ ...newTask, description: e.target.value });
                      setValidationErrors({ ...validationErrors, description: "" });
                    }}
                    rows={4}
                    className={validationErrors.description ? "border-destructive" : ""}
                    maxLength={1000}
                  />
                  {validationErrors.description && (
                    <p className="text-sm text-destructive">{validationErrors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{newTask.description.length}/1000 characters</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Estimated Hours</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0.0"
                      value={newTask.estimated_hours}
                      onChange={(e) => {
                        setNewTask({ ...newTask, estimated_hours: e.target.value });
                        setValidationErrors({ ...validationErrors, estimated_hours: "" });
                      }}
                      className={validationErrors.estimated_hours ? "border-destructive" : ""}
                    />
                    {validationErrors.estimated_hours && (
                      <p className="text-sm text-destructive">{validationErrors.estimated_hours}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  <Label className="flex items-center gap-2">
                    <Package className="h-4 w-4" aria-hidden />
                    Linked resources (optional)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Saved on the new task. Choose an event above if you do not see resources.
                  </p>
                  {!createFormEventId ? (
                    <p className="text-sm text-muted-foreground">Select an event to load resources.</p>
                  ) : createEventResourcesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading resources…</p>
                  ) : createEventResources.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No resources for this event yet.</p>
                  ) : (
                    <div className="max-h-36 space-y-2 overflow-y-auto rounded border bg-background p-2">
                      {createEventResources.map((r) => {
                        const checked = createResourceLinkIds.includes(r.id);
                        return (
                          <label
                            key={r.id}
                            className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-accent/40"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                const on = v === true;
                                setCreateResourceLinkIds((prev) =>
                                  on ? [...new Set([...prev, r.id])] : prev.filter((id) => id !== r.id),
                                );
                              }}
                              className="mt-0.5"
                            />
                            <span className="text-sm leading-snug">{r.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newTask.start_date}
                      onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newTask.end_date}
                      onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due date</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignee-name">Task assigned to (name)</Label>
                  <p className="text-xs text-muted-foreground">
                    Enter the assignee name manually. One primary task per assignee name per event.
                  </p>
                  <Input
                    id="assignee-name"
                    placeholder="Full name"
                    value={assigneeDisplayName}
                    onChange={(e) => setAssigneeDisplayName(e.target.value)}
                    maxLength={120}
                  />
                </div>
              </div>

              {/* Right: assignment types, prerequisites, collaborator checklist — one section each, no duplicates */}
              <div className="space-y-4 min-w-0 rounded-lg border border-border/80 bg-muted/20 p-4 lg:max-h-[min(70vh,720px)] lg:overflow-y-auto">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Assignment type &amp; requirements</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select one or more assignment types (Business Guidelines). Prerequisites merge for all selected
                    types. Confirm prerequisites here only — not repeated in Task details.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Assignment type(s) *</Label>
                  <div className="max-h-52 overflow-y-auto space-y-2 rounded-md border bg-background p-2">
                    {TASK_ASSIGNMENT_CATEGORIES.map((c) => {
                      const selected = parseAssignmentCategoryCsv(newTask.taskCategory).includes(c.value);
                      return (
                        <label
                          key={c.value}
                          className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-accent/40"
                        >
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(checked) => {
                              const cur = new Set(parseAssignmentCategoryCsv(newTask.taskCategory));
                              if (checked === true) cur.add(c.value);
                              else cur.delete(c.value);
                              setNewTask({
                                ...newTask,
                                taskCategory: buildCategoryCsvFromKnownSelection(cur, newTask.taskCategory),
                              });
                            }}
                            className="mt-0.5"
                          />
                          <span className="text-sm leading-snug">{c.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {iepCreateOptions.length > 0 ? (
                  <div className="space-y-3 rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:bg-amber-950/20">
                    <Label className="text-base">Prerequisites (required)</Label>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {iepCreateOptions.map((label) => (
                        <div key={label} className="flex items-start gap-2">
                          <Checkbox
                            id={`iep-create-${label}`}
                            checked={iepPrerequisitesConfirmed[label] === true}
                            onCheckedChange={(checked) =>
                              setIepPrerequisitesConfirmed((prev) => ({
                                ...prev,
                                [label]: checked === true,
                              }))
                            }
                          />
                          <label htmlFor={`iep-create-${label}`} className="text-sm leading-snug cursor-pointer">
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {getCollaboratorTemplatesForCategories(newTask.taskCategory).map((tmpl) => (
                  <div key={tmpl.id} className="space-y-2">
                    <CollaboratorChecklistSection
                      template={tmpl}
                      taskStatus="not_started"
                      forceEditable
                      state={createCollaboratorChecklist}
                      onChange={setCreateCollaboratorChecklist}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setNewTask({
                    title: "",
                    description: "",
                    assigned_user_id: "",
                    priority: "medium" as const,
                    estimated_hours: "",
                    due_date: "",
                    start_date: "",
                    end_date: "",
                    selected_event_id: "",
                    dependencies: [] as string[],
                    assigned_role: "",
                    taskCategory: "",
                    assigned_bookings_role: "",
                    assigned_service_rental_role: "",
                    assigned_hospitality_role: "",
                    assigned_entertainment_role: "",
                    assigned_transportation_role: "",
                    assigned_external_vendor_role: "",
                  });
                  setAssigneeDisplayName("");
                  setIepPrerequisitesConfirmed({});
                  setCreateCollaboratorChecklist({});
                  setValidationErrors({});
                  setShouldPreserveForm(false);
                  toast({
                    title: "Form cleared",
                    description: "All fields have been reset.",
                  });
                }}
                className="flex-1"
              >
                Clear Form
              </Button>
              <Button
                type="button"
                onClick={() => createTask()}
                className="flex-1"
                disabled={isCreatingTask}
              >
                {isCreatingTask ? "Saving…" : "Save task assignment"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => createTask({ skipDependencyDialog: true })}
                className="flex-1"
                disabled={isCreatingTask}
              >
                {isCreatingTask ? "Saving…" : "Save and Exit"}
              </Button>

            </div>
          </DialogContent>
        </Dialog>
        ) : null}
      </div>


      {loading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {embedInManageEvent
              ? "No tasks yet. Use Add task assignment above (same form as Project Management) or open Project Management."
              : "No tasks yet. Create your first task to get started!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.some((t) =>
            parseFollowUpIssuesFromChecklist(t.checklist).some((i) => i.text.trim() && !i.done),
          ) ? (
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="followups-only"
                checked={showFollowUpsOnly}
                onCheckedChange={(c) => setShowFollowUpsOnly(c === true)}
              />
              <label htmlFor="followups-only" className="cursor-pointer text-muted-foreground">
                Show only tasks with open follow-up issues
              </label>
            </div>
          ) : null}
          {taskBoardLayout === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleTasks.map((task) => {
            const StatusIcon = statusIcons[task.status];
            const openFollowUps = parseFollowUpIssuesFromChecklist(task.checklist).filter(
              (i) => i.text.trim() && !i.done,
            ).length;
            const linkedResourceCount = parseTaskResourceAssignments(
              (task as { resource_assignments?: unknown }).resource_assignments,
            ).length;
            return (
              <Card
                key={task.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedTask(task);
                  setSelectedDependencies(task.dependencies || []);
                  setIsEditDialogOpen(true);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base">{task.title}</CardTitle>
                      {openFollowUps > 0 ? (
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {openFollowUps} open follow-up{openFollowUps === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                      {taskCategoryDisplayLabel(task.category) ? (
                        <Badge variant="secondary" className="text-[10px] font-normal max-w-full truncate">
                          {taskCategoryDisplayLabel(task.category)}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                        title="Task comments"
                        onClick={() => {
                          setTaskDiscussTask(task);
                          setTaskDiscussOpen(true);
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                      <Select 
                        value={task.priority} 
                        onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                          updateTask(task.id, { priority: value })
                        }
                      >
                        <SelectTrigger className={`h-7 text-xs ${priorityColors[task.priority]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                  )}

                  {(() => {
                    const sum = getAssignmentSummaryFromTaskRow({
                      category: task.category,
                      checklist: task.checklist,
                    });
                    const hasPrereq = sum.prerequisites.length > 0;
                    const assigneeName =
                      task.assigned_coordinator_name?.trim() ||
                      task.assigned_user_name?.trim() ||
                      task.assigned_to_display_name?.trim() ||
                      "";
                    if (!hasPrereq && sum.checklistTotal === 0 && !assigneeName) return null;
                    return (
                      <div className="rounded-md border border-border/80 bg-muted/30 px-2 py-1.5 space-y-1 text-[11px] text-muted-foreground">
                        {assigneeName ? (
                          <p title={assigneeName}>
                            <span className="font-medium text-foreground">Task assigned to:</span>{" "}
                            {assigneeName}
                          </p>
                        ) : null}
                        {hasPrereq ? (
                          <p className="line-clamp-2" title={sum.prerequisites.join(" · ")}>
                            <span className="font-medium text-foreground">Prerequisites on file:</span>{" "}
                            {sum.prerequisites.join(" · ")}
                          </p>
                        ) : null}
                        {sum.checklistTotal > 0 ? (
                          <p>
                            <span className="font-medium text-foreground">Collaborator checklist:</span>{" "}
                            {sum.checklistDone}/{sum.checklistTotal}
                            {task.status === "not_started" ? " (editable when In progress)" : ""}
                          </p>
                        ) : null}
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <StatusIcon className="h-3 w-3" />
                    <Select value={task.status} onValueChange={(value: any) => updateTask(task.id, { status: value })}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="on_hold">On Hold</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {(task.assigned_user_name ||
                                  task.assigned_role ||
                                  task.assigned_coordinator_name ||
                                  task.assigned_to_display_name) && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>
                                      {task.assigned_user_name ||
                                        task.assigned_role?.replace(/_/g, " ") ||
                                        task.assigned_coordinator_name ||
                                        task.assigned_to_display_name}
                                    </span>
                                  </div>
                                )}

                {!embedInManageEvent ? (
                <div className="border-t pt-3 mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs font-semibold text-foreground">Task assigned to (name)</p>
                  {task.assigned_coordinator_name && !cardCollaboratorInput[task.id] ? (
                    <div className="flex items-center justify-between gap-2 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{task.assigned_coordinator_name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardCollaboratorInput({ ...cardCollaboratorInput, [task.id]: task.assigned_coordinator_name || "" });
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Input
                        placeholder="Enter team member name"
                        value={cardCollaboratorInput[task.id] || ""}
                        onChange={(e) => {
                          e.stopPropagation();
                          setCardCollaboratorInput({ ...cardCollaboratorInput, [task.id]: e.target.value });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          disabled={isSavingCardCollaborator[task.id] || !cardCollaboratorInput[task.id]?.trim()}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const collaboratorName = cardCollaboratorInput[task.id]?.trim();
                            if (!collaboratorName) return;

                            setIsSavingCardCollaborator({ ...isSavingCardCollaborator, [task.id]: true });

                            try {
                              const ok = await updateTask(task.id, {
                                assigned_coordinator_name: collaboratorName,
                              });
                              if (!ok) return;

                              toast({
                                title: "Team member assigned",
                                description: `${collaboratorName} has been assigned to this task.`,
                              });

                              setCardCollaboratorInput({ ...cardCollaboratorInput, [task.id]: "" });
                              fetchTasks();
                            } catch (error) {
                              console.error('Error assigning team member:', error);
                              toast({
                                title: "Error",
                                description: "Failed to assign team member.",
                                variant: "destructive",
                              });
                            } finally {
                              setIsSavingCardCollaborator({ ...isSavingCardCollaborator, [task.id]: false });
                            }
                          }}
                        >
                          {isSavingCardCollaborator[task.id] ? "Saving..." : "Save"}
                        </Button>
                        {task.assigned_coordinator_name && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCardCollaboratorInput({ ...cardCollaboratorInput, [task.id]: "" });
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                ) : null}

                                {task.estimated_hours && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{task.estimated_hours}h</span>
                                  </div>
                                )}

                                {task.due_date && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(new Date(task.due_date), 'MMM d')}</span>
                                  </div>
                                )}

                  {task.dependencies && task.dependencies.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Link className="h-3 w-3" />
                      <span>{task.dependencies.length} dep{task.dependencies.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {linkedResourceCount > 0 ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Package className="h-3 w-3" />
                      <span>
                        {linkedResourceCount} res.
                      </span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
          ) : (
          <TaskKanbanBoard
            tasks={visibleTasks.map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
              due_date: t.due_date,
              assigned_coordinator_name: t.assigned_coordinator_name,
              assigned_user_name: t.assigned_user_name,
              category: t.category,
              linked_resource_count: parseTaskResourceAssignments(
                (t as { resource_assignments?: unknown }).resource_assignments,
              ).length,
            }))}
            onMoveTask={(taskId, status) => {
              void updateTask(taskId, { status });
            }}
            onOpenTask={(t) => {
              const full = visibleTasks.find((x) => x.id === t.id);
              if (!full) return;
              setSelectedTask(full);
              setSelectedDependencies(full.dependencies || []);
              setIsEditDialogOpen(true);
            }}
            onOpenComments={(t) => {
              const full = visibleTasks.find((x) => x.id === t.id);
              if (!full) return;
              setTaskDiscussTask(full);
              setTaskDiscussOpen(true);
            }}
            categoryLabelForTask={(t) => taskCategoryDisplayLabel(t.category)}
          />
          )}
        </div>
      )}

      <TaskDiscussionSheet
        open={taskDiscussOpen}
        onOpenChange={setTaskDiscussOpen}
        taskId={taskDiscussTask?.id ?? null}
        taskTitle={taskDiscussTask?.title ?? ""}
      />

      {/* Edit Task Dialog */}
      {selectedTask && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setSelectedDependencies([]);
            setDependencySearchTerm(""); // Reset search term
          } else {
            setDependencySearchTerm(""); // Reset search term when opening
          }
          setIsEditDialogOpen(open);
        }}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit task assignment</DialogTitle>
              <DialogDescription>
                Task details and timeline on the left; checklist panel on the right (auto template from assignment type
                plus manual follow-ups).
              </DialogDescription>
            </DialogHeader>
            <div className="grid w-full gap-6 lg:grid-cols-2 lg:items-start">
            <div className="space-y-4 min-w-0">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Task Title</Label>
                <Input
                  id="edit-title"
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedTask.description || ""}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={selectedTask.priority}
                  onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                    setSelectedTask({ ...selectedTask, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={selectedTask.status}
                  onValueChange={(value: Task["status"]) =>
                    setSelectedTask({ ...selectedTask, status: value })
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assignment type(s)</Label>
                <p className="text-xs text-muted-foreground">
                  Select one or more types; prerequisites combine for all selected. Legacy types outside this list are
                  kept when you toggle known types.
                </p>
                <div className="max-h-52 overflow-y-auto space-y-2 rounded-md border bg-background p-2">
                  {TASK_ASSIGNMENT_CATEGORIES.map((c) => {
                    const selected = parseAssignmentCategoryCsv(selectedTask.category).includes(c.value);
                    return (
                      <label
                        key={c.value}
                        className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-accent/40"
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) => {
                            const cur = new Set(parseAssignmentCategoryCsv(selectedTask.category));
                            if (checked === true) cur.add(c.value);
                            else cur.delete(c.value);
                            const nextCsv = buildCategoryCsvFromKnownSelection(cur, selectedTask.category);
                            setSelectedTask({
                              ...selectedTask,
                              category: nextCsv || undefined,
                            });
                            const opts = nextCsv.trim()
                              ? getDependencyOptionsForCategories(nextCsv)
                              : [];
                            setEditIepConfirmed((prev) => {
                              const next: Record<string, boolean> = {};
                              opts.forEach((label) => {
                                next[label] = prev[label] === true;
                              });
                              return next;
                            });
                            setEditCollaboratorChecklist((prev) => {
                              const next = { ...prev };
                              for (const tmpl of getCollaboratorTemplatesForCategories(nextCsv)) {
                                for (const id of getAllItemIdsForTemplate(tmpl)) {
                                  if (next[id] === undefined) next[id] = false;
                                }
                              }
                              return next;
                            });
                          }}
                          className="mt-0.5"
                        />
                        <span className="text-sm leading-snug">{c.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {(selectedTask.category?.trim()
                ? getDependencyOptionsForCategories(selectedTask.category)
                : []
              ).length > 0 ? (
                <div className="space-y-3 rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:bg-amber-950/20">
                  <Label className="text-base">Prerequisites (required)</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(selectedTask.category?.trim()
                      ? getDependencyOptionsForCategories(selectedTask.category)
                      : []
                    ).map((label) => (
                      <div key={label} className="flex items-start gap-2">
                        <Checkbox
                          id={`iep-edit-${label}`}
                          checked={editIepConfirmed[label] === true}
                          onCheckedChange={(checked) =>
                            setEditIepConfirmed((prev) => ({
                              ...prev,
                              [label]: checked === true,
                            }))
                          }
                        />
                        <label htmlFor={`iep-edit-${label}`} className="text-sm leading-snug cursor-pointer">
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="edit-hours">Estimated Hours</Label>
                <Input
                  id="edit-hours"
                  type="number"
                  step="0.5"
                  value={selectedTask.estimated_hours ?? ""}
                  onChange={(e) =>
                    setSelectedTask({
                      ...selectedTask,
                      estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" aria-hidden />
                  Linked resources
                </Label>
                <p className="text-xs text-muted-foreground">
                  Choose inventory rows for this event that this task depends on. Saves with{" "}
                  <span className="font-medium">Save changes</span> below.
                </p>
                {!selectedTask.event_id ? (
                  <p className="text-sm text-muted-foreground">This task has no event — link resources after assigning an event.</p>
                ) : eventResourcesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading resources…</p>
                ) : eventResourcesForEdit.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No resources for this event yet. Add them under{" "}
                    <span className="font-medium">Project Management → Resources</span> or Resource Manager.
                  </p>
                ) : (
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded border bg-background p-2">
                    {eventResourcesForEdit.map((r) => {
                      const checked = editResourceLinkIds.includes(r.id);
                      return (
                        <label
                          key={r.id}
                          className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-accent/40"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const on = v === true;
                              setEditResourceLinkIds((prev) =>
                                on ? [...new Set([...prev, r.id])] : prev.filter((id) => id !== r.id),
                              );
                            }}
                            className="mt-0.5"
                          />
                          <span className="text-sm leading-snug">{r.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-due_date">Due Date</Label>
                <Input
                  id="edit-due_date"
                  type="datetime-local"
                  value={
                    selectedTask.due_date
                      ? format(new Date(selectedTask.due_date), "yyyy-MM-dd'T'HH:mm")
                      : ""
                  }
                  onChange={(e) =>
                    setSelectedTask({ ...selectedTask, due_date: e.target.value || undefined })
                  }
                />
              </div>

              <div className="space-y-2 p-3 border border-blue-200 rounded-lg bg-blue-50">
                <Label htmlFor="edit-coordinator-name" className="text-base font-semibold">
                  Task assigned to (name)
                </Label>
                <p className="text-xs text-muted-foreground">Enter the team member or assignee name manually.</p>
                <div className="flex gap-2">
                  <Input
                    id="edit-coordinator-name"
                    placeholder="Enter team member name"
                    value={editCoordinatorName || selectedTask.assigned_coordinator_name || ""}
                    onChange={(e) => setEditCoordinatorName(e.target.value)}
                    maxLength={100}
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      if (editCoordinatorName.trim()) {
                        setIsSavingCoordinatorName(true);
                        try {
                          const ok = await updateTask(selectedTask.id, {
                            assigned_coordinator_name: editCoordinatorName.trim(),
                          });
                          if (!ok) return;
                          setSelectedTask({
                            ...selectedTask,
                            assigned_coordinator_name: editCoordinatorName.trim(),
                          });
                          toast({
                            title: "Coordinator updated",
                            description: `${editCoordinatorName.trim()} assigned to this task`,
                          });
                          setEditCoordinatorName("");
                        } catch {
                          toast({
                            title: "Error",
                            description: "Failed to update coordinator",
                            variant: "destructive",
                          });
                        } finally {
                          setIsSavingCoordinatorName(false);
                        }
                      }
                    }}
                    disabled={!editCoordinatorName.trim() || isSavingCoordinatorName}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSavingCoordinatorName ? "Saving..." : "Change"}
                  </Button>
                </div>
                {selectedTask.assigned_coordinator_name ? (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-300">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{selectedTask.assigned_coordinator_name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const ok = await updateTask(selectedTask.id, {
                            assigned_coordinator_name: null,
                          });
                          if (!ok) return;
                          setSelectedTask({
                            ...selectedTask,
                            assigned_coordinator_name: undefined,
                          });
                          toast({
                            title: "Coordinator removed",
                            description: "Manual coordinator assignment cleared",
                          });
                        } catch {
                          toast({
                            title: "Error",
                            description: "Failed to remove coordinator",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>

              {dependencyPool.filter((task) => task.id !== selectedTask.id).length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Depends on</Label>
                    <span className="text-xs text-muted-foreground">
                      {selectedDependencies.length} of{" "}
                      {dependencyPool.filter((t) => t.id !== selectedTask.id).length} selected
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only tasks in the same event are listed so sequencing follows your event plan.
                  </p>
                  <Input
                    placeholder="Search…"
                    value={dependencySearchTerm}
                    onChange={(e) => setDependencySearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const q = dependencySearchTerm.toLowerCase();
                        const filteredTasks = dependencyPool.filter((task) => {
                          if (task.id === selectedTask.id) return false;
                          if (!q) return true;
                          return (
                            task.title.toLowerCase().includes(q) ||
                            (task.assigned_user_name || "").toLowerCase().includes(q) ||
                            (task.category || "")
                              .toLowerCase()
                              .split(",")
                              .some((p) => p.trim().includes(q))
                          );
                        });
                        setSelectedDependencies(filteredTasks.map((t) => t.id));
                      }}
                    >
                      Select All
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDependencies([])}>
                      Clear All
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                    {dependencyPool
                      .filter((task) => {
                        if (task.id === selectedTask.id) return false;
                        const q = dependencySearchTerm.toLowerCase();
                        if (!q) return true;
                        return (
                          task.title.toLowerCase().includes(q) ||
                          (task.assigned_user_name || "").toLowerCase().includes(q) ||
                          (task.category || "")
                            .toLowerCase()
                            .split(",")
                            .some((p) => p.trim().includes(q))
                        );
                      })
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start space-x-2 p-2 rounded hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            id={`edit-dep-${task.id}`}
                            checked={selectedDependencies.includes(task.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDependencies([...selectedDependencies, task.id]);
                              } else {
                                setSelectedDependencies(selectedDependencies.filter((id) => id !== task.id));
                              }
                            }}
                            className="mt-0.5"
                          />
                          <label htmlFor={`edit-dep-${task.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{task.title}</span>
                              <Badge variant="outline" className={statusColors[task.status]}>
                                {(task.status || "").replace(/_/g, " ") || "—"}
                              </Badge>
                            </div>
                            {task.assigned_user_name ? (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {task.assigned_user_name}
                              </div>
                            ) : null}
                          </label>
                        </div>
                      ))}
                    {dependencyPool.filter((task) => {
                      if (task.id === selectedTask.id) return false;
                      const q = dependencySearchTerm.toLowerCase();
                      if (!q) return true;
                      return (
                        task.title.toLowerCase().includes(q) ||
                        (task.assigned_user_name || "").toLowerCase().includes(q) ||
                        (task.category || "")
                          .toLowerCase()
                          .split(",")
                          .some((p) => p.trim().includes(q))
                      );
                    }).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No tasks found</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

            </div>

            <aside className="space-y-4 min-w-0 rounded-lg border bg-muted/25 p-4 lg:max-h-[min(78vh,720px)] lg:overflow-y-auto">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Checklist panel</h3>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Auto</span> checklist rows come from the assignment
                  category template (aligned with your event theme).{" "}
                  <span className="font-medium text-foreground">Manual</span> lines are free-form follow-ups you add
                  below.
                </p>
              </div>
              {(() => {
                const editTemplates = getCollaboratorTemplatesForCategories(selectedTask.category);
                return editTemplates.length > 0 ? (
                  editTemplates.map((tmpl) => (
                    <div key={tmpl.id} className="space-y-2">
                      <CollaboratorChecklistSection
                        template={tmpl}
                        taskStatus={selectedTask.status}
                        state={editCollaboratorChecklist}
                        onChange={setEditCollaboratorChecklist}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Pick at least one assignment type above to load the collaborator checklist templates.
                  </p>
                );
              })()}
              <div className="space-y-3 rounded-md border bg-background/80 p-3">
                <Label className="text-base">Manual checklist and follow-ups</Label>
                <p className="text-xs text-muted-foreground">
                  Track open threads until this assignment is fully closed.
                </p>
                <div className="space-y-2">
                  {editFollowUps.map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-start">
                      <Checkbox
                        className="mt-2"
                        checked={item.done}
                        onCheckedChange={(c) => {
                          const next = [...editFollowUps];
                          next[idx] = { ...item, done: c === true };
                          setEditFollowUps(next);
                        }}
                      />
                      <Input
                        className="flex-1"
                        value={item.text}
                        onChange={(e) => {
                          const next = [...editFollowUps];
                          next[idx] = { ...item, text: e.target.value };
                          setEditFollowUps(next);
                        }}
                        placeholder="Follow-up description"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setEditFollowUps(editFollowUps.filter((_, i) => i !== idx))}
                        aria-label="Remove follow-up"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditFollowUps([
                      ...editFollowUps,
                      { id: crypto.randomUUID(), text: "", done: false },
                    ])
                  }
                >
                  Add follow-up
                </Button>
              </div>
            </aside>
            </div>

            <div className="mt-6 flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedTask(null);
                  setSelectedDependencies([]);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateTask} className="flex-1">
                Save task assignment
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  await handleUpdateTask();
                  setIsEditDialogOpen(false);
                  setSelectedTask(null);
                  setSelectedDependencies([]);
                }}
                className="flex-1"
              >
                Save and Exit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Task ordering — other tasks that must complete first */}
      <Dialog open={showDependencyDialog} onOpenChange={setShowDependencyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task ordering (dependencies)</DialogTitle>
            <DialogDescription>
              Choose which other tasks must finish before this one.               These are{" "}
              <strong>task-to-task</strong> ordering (which tasks finish first). This is separate from change
              requests, which you handle under Manage Event or Project Management.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {dependencyPool.filter((task) => task.id !== taskForDependencies?.id).length > 0 ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Depends on</Label>
                    <span className="text-xs text-muted-foreground">
                      {selectedDependencies.length} of{" "}
                      {dependencyPool.filter((t) => t.id !== taskForDependencies?.id).length} selected
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only tasks in the same event are listed so sequencing follows your event plan.
                  </p>

                  <Input
                    placeholder="Search…"
                    value={dependencySearchTerm}
                    onChange={(e) => setDependencySearchTerm(e.target.value)}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const q = dependencySearchTerm.toLowerCase();
                        const filteredTasks = dependencyPool.filter((task) => {
                          if (task.id === taskForDependencies?.id) return false;
                          if (!q) return true;
                          return (
                            task.title.toLowerCase().includes(q) ||
                            (task.assigned_user_name || "").toLowerCase().includes(q) ||
                            (task.category || "")
                              .toLowerCase()
                              .split(",")
                              .some((p) => p.trim().includes(q))
                          );
                        });
                        setSelectedDependencies(filteredTasks.map((t) => t.id));
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDependencies([])}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 border rounded-md p-3">
                  {dependencyPool
                    .filter((task) => {
                      if (task.id === taskForDependencies?.id) return false;
                      const q = dependencySearchTerm.toLowerCase();
                      if (!q) return true;
                      return (
                        task.title.toLowerCase().includes(q) ||
                        (task.assigned_user_name || "").toLowerCase().includes(q) ||
                        (task.category || "")
                          .toLowerCase()
                          .split(",")
                          .some((p) => p.trim().includes(q))
                      );
                    })
                    .map((task) => (
                      <div key={task.id} className="flex items-start space-x-2 p-2 rounded hover:bg-accent/50 transition-colors">
                        <Checkbox
                          id={`new-dep-${task.id}`}
                          checked={selectedDependencies.includes(task.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDependencies([...selectedDependencies, task.id]);
                            } else {
                              setSelectedDependencies(selectedDependencies.filter(id => id !== task.id));
                            }
                          }}
                          className="mt-0.5"
                        />
                        <label htmlFor={`new-dep-${task.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{task.title}</span>
                            <Badge variant="outline" className={statusColors[task.status]}>
                              {(task.status || "").replace(/_/g, " ") || "—"}
                            </Badge>
                            {task.category && task.category.split(', ').map((cat, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                          {task.assigned_user_name && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {task.assigned_user_name}
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                  {(() => {
                    const q = dependencySearchTerm.toLowerCase();
                    const filteredTasks = dependencyPool.filter((task) => {
                      if (task.id === taskForDependencies?.id) return false;
                      if (!q) return true;
                      return (
                        task.title.toLowerCase().includes(q) ||
                        (task.assigned_user_name || "").toLowerCase().includes(q) ||
                        (task.category || "")
                          .toLowerCase()
                          .split(",")
                          .some((p) => p.trim().includes(q))
                      );
                    });
                    
                    if (filteredTasks.length === 0 && dependencySearchTerm) {
                      return (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No results
                        </p>
                      );
                    }
                    
                    if (filteredTasks.length === 0) {
                      return <p className="text-sm text-muted-foreground text-center py-4">No tasks available</p>;
                    }
                    
                    return null;
                  })()}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No other tasks</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4 mb-2 px-1">
            <Checkbox
              id="clear-form"
              checked={clearFormAfterSave}
              onCheckedChange={(checked) => setClearFormAfterSave(checked === true)}
            />
            <label htmlFor="clear-form" className="text-sm text-muted-foreground cursor-pointer">
              Clear form after save
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDependencyDialog(false);
                setTaskForDependencies(null);
                setSelectedDependencies([]);
                setDependencySearchTerm("");
                setShouldPreserveForm(false);
                setIsCreateDialogOpen(false);
                
                if (clearFormAfterSave) {
                  setNewTask({
                    title: "",
                    description: "",
                    assigned_user_id: "",
                    priority: "medium",
                    estimated_hours: "",
                    due_date: "",
                    start_date: "",
                    end_date: "",
                    selected_event_id: "",
                    dependencies: [],
                    assigned_role: "",
                    taskCategory: "",
                    assigned_bookings_role: "",
                    assigned_service_rental_role: "",
                    assigned_hospitality_role: "",
                    assigned_entertainment_role: "",
                    assigned_transportation_role: "",
                    assigned_external_vendor_role: "",
                  });
                  setIepPrerequisitesConfirmed({});
                  setClearFormAfterSave(false);
                }
                
                toast({
                  title: "Saved",
                });
              }}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={async () => {
                if (!taskForDependencies?.id) return;
                
                try {
                  if (selectedDependencies.length > 0) {
                    await saveDependencies(taskForDependencies.id, selectedDependencies);
                  }
                  
                  setShowDependencyDialog(false);
                  setTaskForDependencies(null);
                  setSelectedDependencies([]);
                  setDependencySearchTerm("");
                  setShouldPreserveForm(false);
                  setIsCreateDialogOpen(false);
                  
                  if (clearFormAfterSave) {
                    setNewTask({
                      title: "",
                      description: "",
                      assigned_user_id: "",
                      priority: "medium",
                      estimated_hours: "",
                      due_date: "",
                      start_date: "",
                      end_date: "",
                      selected_event_id: "",
                      dependencies: [],
                      assigned_role: "",
                      taskCategory: "",
                      assigned_bookings_role: "",
                      assigned_service_rental_role: "",
                      assigned_hospitality_role: "",
                      assigned_entertainment_role: "",
                      assigned_transportation_role: "",
                      assigned_external_vendor_role: "",
                    });
                    setIepPrerequisitesConfirmed({});
                    setClearFormAfterSave(false);
                  }
                  
                  await fetchTasks();
                  
                  toast({
                    title: "Saved",
                  });
                } catch (error) {
                  console.error('Error saving dependencies:', error);
                  toast({
                    title: "Error",
                    description: "Failed to save dependencies. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Due Date Conflict Confirmation Dialog */}
      <Dialog open={dueDateConflictDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          dueDateConflictDialog.onCancel();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Due Date Conflict Detected</DialogTitle>
            <DialogDescription>
              Review the suggested date before continuing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This task depends on other tasks that have later due dates. The task's due date needs to be adjusted to avoid conflicts.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Current due date:</span>
                <span>{dueDateConflictDialog.currentDate ? format(new Date(dueDateConflictDialog.currentDate), 'MMM dd, yyyy') : 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Suggested due date:</span>
                <span className="text-blue-600 font-medium">{dueDateConflictDialog.suggestedDate ? format(new Date(dueDateConflictDialog.suggestedDate), 'MMM dd, yyyy') : 'Not set'}</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={dueDateConflictDialog.onCancel}>
                Cancel
              </Button>
              <Button onClick={dueDateConflictDialog.onConfirm}>
                Continue with Suggested Date
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dependent Tasks Conflict Dialog */}
      <Dialog 
        open={dependentTasksConflictDialog.isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            dependentTasksConflictDialog.onCancel();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dependent Tasks Update Required</DialogTitle>
            <DialogDescription>
              These linked tasks will be updated to keep dependency order valid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Updating this task's due date will affect {dependentTasksConflictDialog.affectedTasks.length} dependent task{dependentTasksConflictDialog.affectedTasks.length > 1 ? 's' : ''} that currently have earlier due dates. These tasks will be automatically updated to maintain proper dependency order.
            </p>
            
            <div className="space-y-3">
              <h4 className="font-medium">Tasks that will be updated:</h4>
              {dependentTasksConflictDialog.affectedTasks.map((task) => (
                <div key={task.id} className="p-3 border rounded-lg space-y-1">
                  <p className="font-medium">{task.title}</p>
                  <div className="text-sm text-muted-foreground">
                    <p>Current due date: {format(new Date(task.currentDueDate), 'PPP')}</p>
                    <p>New due date: {format(new Date(task.newDueDate), 'PPP')}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={dependentTasksConflictDialog.onCancel}>
                Cancel
              </Button>
              <Button onClick={dependentTasksConflictDialog.onConfirm}>
                Continue and Update All Tasks
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-4">Create your first task to get started.</p>
        </div>
      )}
    </div>
  );
}