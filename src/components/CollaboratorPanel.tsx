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

type RequestType = "change_request" | "new_requirement" | "issue";

interface CollaboratorPanelProps {
  selectedEventFilter: string;
  /** After a change request is posted, parent can switch to Tasks tab */
  onChangeRequestPosted?: () => void;
  /** Switch PM to the Tasks tab (parent-controlled tabs) */
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
    priority: "medium" as "low" | "medium" | "high" | "urgent",
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
        description: "Choose an event with the filter at the top of Project Management.",
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

      const { data: taskRow, error: taskErr } = await supabase
        .from("tasks")
        .insert({
          title: taskTitle,
          description: form.description.trim(),
          event_id: eventId,
          priority: form.priority,
          status: "not_started",
          category: "Change Management",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (taskErr) throw taskErr;

      const taskId = taskRow?.id;
      if (taskId) {
        const { error: crErr } = await supabase.from("cm_change_requests").insert({
          event_id: eventId,
          description: form.description.trim(),
          field_changed: "pm_collaborator_request",
          priority_tag: form.priority,
          requested_by: user.id,
          status: "open",
          task_id: taskId,
        });
        if (crErr) console.warn("cm_change_requests:", crErr);
      }

      await supabase.rpc("notify_coordinators", {
        p_title: `New ${typeLabel}: ${form.title.trim()}`,
        p_message: form.description.trim(),
        p_type: "new_request",
        p_entity_type: "event",
        p_entity_id: eventId,
      });

      toast({
        title: "Request sent",
        description: "Coordinators have been notified.",
      });

      setDialogOpen(false);
      setForm({
        title: "",
        description: "",
        priority: "medium",
        type: "change_request",
      });
      onChangeRequestPosted?.();
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to submit",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Create change request</CardTitle>
            <CardDescription>
              Sends your request to coordinators. They review it with the rest of the event tasks.
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
              Coordinators get a notification and can open your request from the Tasks section.
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
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v: "low" | "medium" | "high" | "urgent") =>
                  setForm((f) => ({ ...f, priority: v }))
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
            <Button
              className="w-full"
              disabled={submitting || !form.title.trim() || !form.description.trim()}
              onClick={() => void submitChangeRequest()}
            >
              <Bell className="h-4 w-4 mr-2" />
              {submitting ? "Submitting…" : "Submit & notify"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Team checklists</CardTitle>
          <CardDescription>
            Check off items as you go. Progress is saved on this device for this event only (
            {completedCount}/{totalItems} done).
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

      {onGoToTasksTab && (
        <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-primary"
            onClick={onGoToTasksTab}
          >
            Open Tasks
          </Button>
          <span>to review or assign work.</span>
        </p>
      )}
    </div>
  );
}
