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
  });

  const eventId = selectedEventFilter !== "all" ? selectedEventFilter : null;

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

      const { error: crErr } = await supabase.from("cm_change_requests").insert({
        event_id: eventId,
        description: form.description.trim(),
        field_changed: "pm_collaborator_request",
        priority_tag: taskPriority,
        rollout_timing: form.rolloutTiming,
        requested_by: user.id,
        status: "pending",
        task_id: taskId,
      });
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
                className="flex-1"
                disabled={submitting || !form.title.trim() || !form.description.trim()}
                onClick={() => void submitChangeRequest()}
              >
                <Bell className="h-4 w-4 mr-2" />
                {submitting ? "Submitting…" : "Submit & notify"}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={submitting || !form.title.trim() || !form.description.trim()}
                onClick={async () => {
                  await submitChangeRequest();
                  setDialogOpen(false);
                }}
              >
                {submitting ? "Saving…" : "Save and Exit"}
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
