import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  COLLABORATOR_CHECKLISTS,
  getCollaboratorTemplatesForCategories,
  storageKeyForCollaboratorChecklists,
} from "@/lib/collaboratorChecklists";
import { Bell, Plus } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import {
  commentsPlannerCopy,
  plannerSafeErrorToastDescription,
  plannerToolsCopy,
} from "@/lib/nudges";
import type { RolloutTiming } from "@/lib/changeRequestRollout";
import { ROLLOUT_TIMING_LABELS, taskPriorityFromRollout } from "@/lib/changeRequestRollout";
import { notifyStakeholdersUrgentChangeRequest } from "@/lib/urgentChangeRequestNotifications";

type RequestType = "change_request" | "new_requirement" | "issue";

type TaskStatus = "not_started" | "in_progress" | "completed" | "on_hold" | "cancelled";

interface AssignedTaskRow {
  id: string;
  title: string;
  status: TaskStatus | null;
  priority: string | null;
  assigned_to: string | null;
  assigned_to_display_name: string | null;
  category: string | null;
  checklist: Record<string, unknown> | null;
}

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

interface CollaboratorPanelProps {
  selectedEventFilter: string;
  /** After a change request is posted, parent can switch to the Task tab */
  onChangeRequestPosted?: () => void;
  /** Switch PM to the Task tab (parent-controlled tabs) */
  onGoToTasksTab?: () => void;
}

export function CollaboratorPanel({
  selectedEventFilter,
  onChangeRequestPosted,
  onGoToTasksTab,
}: CollaboratorPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    rolloutTiming: "optional" as RolloutTiming,
    type: "change_request" as RequestType,
    locationId: "" as string,
  });
  const [assignedTasks, setAssignedTasks] = useState<AssignedTaskRow[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [eventLocations, setEventLocations] = useState<{ id: string; name: string | null; address: string | null }[]>([]);

  const eventId = selectedEventFilter !== "all" ? selectedEventFilter : null;

  useEffect(() => {
    if (!eventId) { setEventLocations([]); return; }
    (async () => {
      const { data } = await supabase
        .from("cm_locations")
        .select("id, name, address")
        .eq("event_id", eventId)
        .order("name");
      setEventLocations((data as typeof eventLocations) || []);
    })();
  }, [eventId]);

  const loadFromStorage = useCallback(() => {
    if (!eventId) {
      setChecked({});
      return;
    }
    try {
      const raw = localStorage.getItem(storageKeyForCollaboratorChecklists(eventId));
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
      else setChecked({});
    } catch {
      setChecked({});
    }
  }, [eventId]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const persist = useCallback(
    (next: Record<string, boolean>) => {
      if (!eventId) return;
      try {
        localStorage.setItem(
          storageKeyForCollaboratorChecklists(eventId),
          JSON.stringify(next)
        );
      } catch {
        /* ignore quota */
      }
    },
    [eventId]
  );

  const toggleItem = (flatId: string, value: boolean) => {
    setChecked((prev) => {
      const next = { ...prev, [flatId]: value };
      persist(next);
      return next;
    });
  };

  // Live assigned-task list pulled from PM/Task (tasks.assigned_to / assigned_to_display_name)
  const fetchAssignedTasks = useCallback(async () => {
    if (!eventId) {
      setAssignedTasks([]);
      return;
    }
    setAssignedLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("tasks")
        .select("id, title, status, priority, assigned_to, assigned_to_display_name, category, checklist, archived, event_id")
        .eq("event_id", eventId)
        .neq("archived", true)
        .order("status", { ascending: true })
        .order("title", { ascending: true });
      if (error) throw error;
      const rows = (data || []).filter(
        (t: any) => (t.assigned_to && t.assigned_to.length > 0) ||
                    (t.assigned_to_display_name && t.assigned_to_display_name.trim().length > 0)
      ) as AssignedTaskRow[];
      setAssignedTasks(rows);
    } catch (e) {
      // swallow - toast in caller paths
    } finally {
      setAssignedLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void fetchAssignedTasks();
  }, [fetchAssignedTasks]);

  // Realtime sync from PM/Task changes
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`collab-panel-tasks-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `event_id=eq.${eventId}` },
        () => {
          void fetchAssignedTasks();
        }
      )
      .subscribe();
    const onLocal = () => void fetchAssignedTasks();
    if (typeof window !== "undefined") {
      window.addEventListener("iep-refetch-tasks", onLocal);
    }
    return () => {
      supabase.removeChannel(channel);
      if (typeof window !== "undefined") {
        window.removeEventListener("iep-refetch-tasks", onLocal);
      }
    };
  }, [eventId, fetchAssignedTasks]);

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setAssignedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
    const { error } = await supabase
      .from("tasks")
      .update({ status } as any)
      .eq("id", taskId);
    if (error) {
      toast({
        title: "Status update failed",
        description: error.message,
        variant: "destructive",
      });
      void fetchAssignedTasks();
      return;
    }
    toast({ title: "Task updated", description: `Status set to ${TASK_STATUS_LABELS[status]}.` });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("iep-refetch-tasks"));
    }
  };

  const updateTaskChecklistItem = async (taskId: string, itemId: string, value: boolean) => {
    const task = assignedTasks.find((t) => t.id === taskId);
    const existing = (task?.checklist ?? {}) as Record<string, unknown>;
    const existingCC = (existing.collaborator_checklist ?? {}) as Record<string, boolean>;
    const nextCC = { ...existingCC, [itemId]: value };
    const nextChecklist = { ...existing, collaborator_checklist: nextCC };

    setAssignedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, checklist: nextChecklist } : t))
    );
    const { error } = await (supabase as any)
      .from("tasks")
      .update({ checklist: nextChecklist })
      .eq("id", taskId);
    if (error) {
      toast({
        title: "Checklist update failed",
        description: error.message,
        variant: "destructive",
      });
      void fetchAssignedTasks();
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("iep-refetch-tasks"));
    }
  };

  const tasksByAssignee = useMemo(() => {
    const groups = new Map<string, AssignedTaskRow[]>();
    for (const t of assignedTasks) {
      const key = (t.assigned_to_display_name?.trim() || t.assigned_to || "Unnamed collaborator");
      const arr = groups.get(key) ?? [];
      arr.push(t);
      groups.set(key, arr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [assignedTasks]);


  const totalItems = useMemo(() => {
    let n = 0;
    for (const c of COLLABORATOR_CHECKLISTS) {
      for (const s of c.sections) n += s.items.length;
    }
    return n;
  }, []);

  const completedCount = useMemo(() => {
    let n = 0;
    for (const c of COLLABORATOR_CHECKLISTS) {
      for (const s of c.sections) {
        for (const it of s.items) {
          const key = `${c.id}::${it.id}`;
          if (checked[key]) n++;
        }
      }
    }
    return n;
  }, [checked]);

  const submitChangeRequest = async () => {
    if (!user?.id || !eventId) {
      toast({
        title: "Select an event",
        description: plannerToolsCopy.taskSelectEventHint,
        variant: "destructive",
      });
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      toast({
        title: "Missing fields",
        description: "Add a title and description.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const typeLabel = form.type.replace(/_/g, " ");
      const taskTitle = `[${typeLabel}] ${form.title.trim()}`;
      const taskPriority = taskPriorityFromRollout(form.rolloutTiming);
      const coordTitle =
        form.rolloutTiming === "urgent"
          ? `URGENT — New ${typeLabel}: ${form.title.trim()}`
          : `New ${typeLabel}: ${form.title.trim()}`;

      const { data: taskRow, error: taskErr } = await supabase
        .from("tasks")
        .insert({
          title: taskTitle,
          description: form.description.trim(),
          event_id: eventId,
          priority: taskPriority,
          status: "not_started",
          category: "Change Management",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (taskErr) throw taskErr;

      const taskId = taskRow?.id;
      if (!taskId) {
        throw new Error("Task was not created; cannot attach a change request.");
      }

      const deviceInfo = {
        platform: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
        ua: navigator.userAgent,
      };

      const { error: crErr } = await supabase.from("cm_change_requests").insert({
        event_id: eventId,
        description: form.description.trim(),
        field_changed: "pm_collaborator_request",
        priority_tag: taskPriority,
        rollout_timing: form.rolloutTiming,
        requested_by: user.id,
        status: "pending",
        task_id: taskId,
        ...(form.locationId ? { location_id: form.locationId } : {}),
        device_info: deviceInfo,
      } as any);
      if (crErr) {
        await supabase.from("tasks").delete().eq("id", taskId);
        throw crErr;
      }

      await supabase.rpc("notify_coordinators", {
        p_title: coordTitle,
        p_message: form.description.trim(),
        p_type: "new_request",
        p_entity_type: "event",
        p_entity_id: eventId,
      });

      let sentDetail = "Coordinators have been notified.";
      if (form.rolloutTiming === "urgent") {
        try {
          const n = await notifyStakeholdersUrgentChangeRequest({
            eventId,
            senderId: user.id,
            requestTitle: form.title.trim(),
            requestDescription: form.description.trim(),
          });
          if (n > 0) sentDetail += ` ${n} stakeholder(s) also received an in-app urgent alert.`;
        } catch (e) {
          console.warn("notifyStakeholdersUrgentChangeRequest:", e);
        }
      }

      toast({
        title: "Request sent",
        description: sentDetail,
      });

      setDialogOpen(false);
      setForm({
        title: "",
        description: "",
        rolloutTiming: "optional",
        type: "change_request",
        locationId: "",
      });
      onChangeRequestPosted?.();
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: plannerSafeErrorToastDescription(e, commentsPlannerCopy.toastGeneric),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Communication</CardTitle>
          <CardDescription>
            Use the sidebar Communication Hub for threaded discussion. Coordinators see the same event scope
            there.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" asChild>
            <RouterLink to="/dashboard/comments">Open Communication Hub</RouterLink>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task assignment collaborator checklists</CardTitle>
          <CardDescription>
            General readiness items for collaborators (saved on this device for this event:{" "}
            {completedCount}/{totalItems} done). Per-task checklists tied to assignment type appear on each
            task in Task Management and in the Task assignment section above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {COLLABORATOR_CHECKLISTS.map((cl) => (
              <AccordionItem key={cl.id} value={cl.id}>
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex flex-col items-start gap-0.5 pr-2">
                    <span className="font-medium">{cl.title}</span>
                    <span className="text-xs font-normal text-muted-foreground">{cl.role}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2 pl-1">
                    {cl.sections.map((sec) => (
                      <div key={sec.title}>
                        <p className="text-sm font-semibold text-foreground/90 mb-2">
                          {sec.title}
                        </p>
                        <ul className="space-y-2">
                          {sec.items.map((it) => {
                            const flatId = `${cl.id}::${it.id}`;
                            return (
                              <li key={flatId} className="flex items-start gap-3">
                                <Checkbox
                                  id={flatId}
                                  checked={Boolean(checked[flatId])}
                                  disabled={!eventId}
                                  onCheckedChange={(v) => toggleItem(flatId, v === true)}
                                />
                                <label
                                  htmlFor={flatId}
                                  className="text-sm leading-tight cursor-pointer"
                                >
                                  {it.label}
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {eventId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                if (!window.confirm("Clear all checklist marks for this event?")) return;
                setChecked({});
                persist({});
              }}
            >
              Reset checklists for this event
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Assigned tasks (from Task tab)</CardTitle>
            <CardDescription>
              Auto-synced from PM/Task assignments. Update status here — changes appear instantly in PM/Task.
            </CardDescription>
          </div>
          {onGoToTasksTab && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGoToTasksTab}
              className="shrink-0"
            >
              Open Task tab to edit checklists
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!eventId ? (
            <p className="text-sm text-muted-foreground">
              Choose an event at the top of the page to see assigned tasks.
            </p>
          ) : assignedLoading && assignedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading assigned tasks…</p>
          ) : tasksByAssignee.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tasks have been assigned yet. Assign a collaborator in the Task tab and they will appear here automatically.
            </p>
          ) : (
            <div className="space-y-4">
              {tasksByAssignee.map(([assignee, tasks]) => (
                <div key={assignee} className="rounded-xl border bg-card/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-sm">{assignee}</p>
                    <span className="text-xs text-muted-foreground">
                      {tasks.length} task{tasks.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <Accordion type="multiple" className="space-y-2">
                    {tasks.map((t) => {
                      const templates = getCollaboratorTemplatesForCategories(t.category);
                      const cc = ((t.checklist as any)?.collaborator_checklist ?? {}) as Record<string, boolean>;
                      const totalItems = templates.reduce(
                        (n, tmpl) => n + tmpl.sections.reduce((m, s) => m + s.items.length, 0),
                        0,
                      );
                      const doneItems = templates.reduce(
                        (n, tmpl) =>
                          n +
                          tmpl.sections.reduce(
                            (m, s) => m + s.items.filter((i) => cc[i.id] === true).length,
                            0,
                          ),
                        0,
                      );
                      return (
                        <AccordionItem
                          key={t.id}
                          value={t.id}
                          className="rounded-lg border bg-background/60"
                        >
                          <div className="flex flex-col gap-2 px-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" title={t.title}>
                                {t.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t.category || "Task"}
                                {t.priority ? ` · ${t.priority}` : ""}
                                {totalItems > 0 ? ` · checklist ${doneItems}/${totalItems}` : ""}
                              </p>
                            </div>
                            <div className="shrink-0">
                              <Select
                                value={(t.status as TaskStatus) || "not_started"}
                                onValueChange={(v) => void updateTaskStatus(t.id, v as TaskStatus)}
                              >
                                <SelectTrigger className="h-8 w-[150px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((k) => (
                                    <SelectItem key={k} value={k} className="text-xs">
                                      {TASK_STATUS_LABELS[k]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <AccordionTrigger className="px-3 py-2 text-xs">
                            {templates.length === 0
                              ? "No assignment type set"
                              : `Open ${templates.map((tmpl) => tmpl.title).join(" + ")}`}
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3">
                            {templates.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                Set an assignment type on this task in PM/Task to load its Business Rules checklist.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {templates.map((tmpl) => (
                                  <div key={tmpl.id} className="rounded-md border bg-card/40 p-3">
                                    <p className="text-xs font-semibold">{tmpl.title}</p>
                                    <p className="text-[11px] text-muted-foreground mb-2">{tmpl.role}</p>
                                    <div className="space-y-2">
                                      {tmpl.sections.map((section) => (
                                        <div key={section.title}>
                                          <p className="text-[11px] font-medium text-muted-foreground mb-1">
                                            {section.title}
                                          </p>
                                          <ul className="space-y-1">
                                            {section.items.map((it) => {
                                              const inputId = `cc-${t.id}-${it.id}`;
                                              return (
                                                <li key={it.id} className="flex items-start gap-2">
                                                  <Checkbox
                                                    id={inputId}
                                                    checked={cc[it.id] === true}
                                                    onCheckedChange={(c) =>
                                                      void updateTaskChecklistItem(t.id, it.id, c === true)
                                                    }
                                                    className="mt-0.5"
                                                  />
                                                  <label
                                                    htmlFor={inputId}
                                                    className="text-xs leading-snug cursor-pointer"
                                                  >
                                                    {it.label}
                                                  </label>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>

        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Create change request</CardTitle>
            <CardDescription>
              Creates a coordinator task and change-management record. Coordinators review it in Task
              Management and Manage Event alongside other work.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => setDialogOpen(true)}
            disabled={!eventId}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create change request
          </Button>
        </CardHeader>
        {!eventId && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Choose an event at the top of the page to use change requests and checklists.
            </p>
          </CardContent>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Create change request</DialogTitle>
            <DialogDescription>
              Coordinators get a notification and can open your request from the Task tab.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cr-title">Title</Label>
              <Input
                id="cr-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Brief summary"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v: RequestType) => setForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="change_request">Change Request</SelectItem>
                  <SelectItem value="new_requirement">New Requirement</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rollout timing</Label>
              <Select
                value={form.rolloutTiming}
                onValueChange={(v: RolloutTiming) => setForm((f) => ({ ...f, rolloutTiming: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLLOUT_TIMING_LABELS) as RolloutTiming[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {ROLLOUT_TIMING_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Urgent timing also sends in-app alerts to people following this event.
              </p>
            </div>
            {eventLocations.length > 0 && (
              <div>
                <Label>Location</Label>
                <Select
                  value={form.locationId || "__none__"}
                  onValueChange={(v) => setForm((f) => ({ ...f, locationId: v === "__none__" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">All locations</SelectItem>
                    {eventLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name || loc.address || loc.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="cr-desc">Description</Label>
              <Textarea
                id="cr-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="What should change, and why?"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={submitting}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={submitting || !form.title.trim() || !form.description.trim()}
                onClick={() => void submitChangeRequest()}
              >
                <Bell className="h-4 w-4 mr-2" />
                {submitting ? "Submitting…" : "Submit & notify"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {onGoToTasksTab && (
        <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-primary"
            onClick={onGoToTasksTab}
          >
            Open Task tab
          </Button>
          <span>to review or assign work.</span>
        </p>
      )}
    </div>
  );
}
