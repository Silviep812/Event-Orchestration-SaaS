import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEventApprovalRights } from "@/hooks/useEventApprovalRights";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { applyChangeRequestToEvent } from "@/lib/applyChangeRequestToEvent";
import {
  commentsPlannerCopy,
  plannerSafeErrorToastDescription,
  plannerToolsCopy,
} from "@/lib/nudges";
import { buildChangeRequestInterpretation, type EventContextForInterpretation } from "@/lib/changeRequestLabel";
import type { RolloutTiming } from "@/lib/changeRequestRollout";
import { ROLLOUT_TIMING_LABELS } from "@/lib/changeRequestRollout";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ChangeRequestRow = {
  id: string;
  created_at: string;
  description: string | null;
  field_changed: string | null;
  status: string | null;
  priority_tag: string | null;
  rollout_timing: string;
  task_id: string | null;
  event_id: string | null;
  new_value: string | null;
  old_value: string | null;
  requested_by: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  location_id: string | null;
  device_info: { platform?: string } | null;
};

function rolloutTimingVariant(
  timing: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  const t = (timing || "").toLowerCase();
  if (t === "urgent") return "destructive";
  if (t === "deferred") return "outline";
  return "secondary";
}

function rolloutTimingLabel(timing: string | null | undefined): string {
  const t = (timing || "optional").toLowerCase();
  if (t === "urgent" || t === "optional" || t === "deferred") {
    return ROLLOUT_TIMING_LABELS[t as RolloutTiming];
  }
  return timing || "Optional";
}

function statusVariant(
  status: string | null,
): "default" | "secondary" | "destructive" | "outline" {
  const s = (status || "").toLowerCase();
  if (s === "open" || s === "pending") return "default";
  if (s === "approved" || s === "resolved" || s === "closed") return "secondary";
  if (s === "rejected" || s === "cancelled") return "destructive";
  return "outline";
}

/** Open/pending first; among those, urgent rollout then newest. */
function sortChangeRequestsForCoordinatorQueue(rows: ChangeRequestRow[]): ChangeRequestRow[] {
  const actionable = (s: string | null) => {
    const v = (s || "").toLowerCase();
    return v === "open" || v === "pending";
  };
  const rolloutRank = (t: string | null | undefined) => {
    const v = (t || "").toLowerCase();
    if (v === "urgent") return 0;
    if (v === "optional") return 1;
    if (v === "deferred") return 2;
    return 3;
  };
  return [...rows].sort((a, b) => {
    const aa = actionable(a.status) ? 0 : 1;
    const bb = actionable(b.status) ? 0 : 1;
    if (aa !== bb) return aa - bb;
    if (aa === 0) {
      const ru = rolloutRank(a.rollout_timing) - rolloutRank(b.rollout_timing);
      if (ru !== 0) return ru;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export type EventChangeRequestsListProps = {
  eventId: string;
  /** Increment from parent to force reload (e.g. after Refresh or new submission). */
  refreshToken?: number;
  /** Tighter layout when embedded in Manage Event. */
  compact?: boolean;
};

/**
 * Loads `cm_change_requests` for one event with approve / reject actions (same behavior as
 * Project Management → Change Management).
 */
export function EventChangeRequestsList({ eventId, refreshToken = 0, compact }: EventChangeRequestsListProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { canApproveChangeRequests, loading: rightsLoading } = useEventApprovalRights(eventId);
  const [rows, setRows] = useState<ChangeRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({});
  const [userDisplayNames, setUserDisplayNames] = useState<Record<string, string>>({});
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});
  const [interpretCtx, setInterpretCtx] = useState<EventContextForInterpretation>({
    eventTitle: null,
    eventDate: null,
    themeName: null,
    categoryName: null,
  });

  const load = useCallback(async () => {
    if (!eventId) {
      setRows([]);
      setTaskTitles({});
      setUserDisplayNames({});
      return;
    }
    setLoading(true);
    try {
      const { data: evRow, error: evErr } = await supabase
        .from("events")
        .select("title, start_date, theme_id, type_id")
        .eq("id", eventId)
        .maybeSingle();
      if (evErr) console.warn("events (CM interpret):", evErr);

      let themeName: string | null = null;
      let categoryName: string | null = null;
      if (evRow?.theme_id != null) {
        const { data: th } = await supabase.from("Themes Directory Catalog").select("name").eq("id", evRow.theme_id).maybeSingle();
        themeName = th?.name ?? null;
      }
      if (evRow?.type_id != null) {
        const { data: ty } = await supabase.from("event_types").select("name").eq("id", evRow.type_id).maybeSingle();
        categoryName = ty?.name ?? null;
      }
      setInterpretCtx({
        eventTitle: evRow?.title ?? null,
        eventDate: evRow?.start_date ?? null,
        themeName,
        categoryName,
      });

      const { data, error } = await supabase
        .from("cm_change_requests")
        .select(
          "id, created_at, description, field_changed, status, priority_tag, rollout_timing, task_id, event_id, new_value, old_value, requested_by, resolved_by, resolved_at, location_id, device_info",
        )
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.warn("cm_change_requests:", error);
        toast({
          title: "Could not load change requests",
          description: plannerSafeErrorToastDescription(error, plannerToolsCopy.changeManagementLoadFailed),
          variant: "destructive",
        });
        setRows([]);
        setTaskTitles({});
        setUserDisplayNames({});
      } else {
        const rowsData = (data ?? []) as ChangeRequestRow[];
        const taskIds = [...new Set(rowsData.map((r) => r.task_id).filter(Boolean))] as string[];
        const titles: Record<string, string> = {};
        if (taskIds.length) {
          const { data: ts, error: tErr } = await supabase.from("tasks").select("id,title").in("id", taskIds);
          if (tErr) console.warn("tasks (CM titles):", tErr);
          (ts || []).forEach((t: { id: string; title: string }) => {
            titles[t.id] = t.title;
          });
        }
        const profileUserIds = [
          ...new Set(
            rowsData.flatMap((r) => [r.requested_by, r.resolved_by].filter(Boolean) as string[]),
          ),
        ];
        const names: Record<string, string> = {};
        if (profileUserIds.length) {
          const { data: rp, error: rpErr } = await supabase
            .from("public_profiles")
            .select("user_id, display_name")
            .in("user_id", profileUserIds);
          if (rpErr) console.warn("public_profiles (CM users):", rpErr);
          (rp || []).forEach((p: { user_id: string; display_name: string | null }) => {
            names[p.user_id] = p.display_name?.trim() || "Member";
          });
        }
        const locIds = [...new Set(rowsData.map((r) => (r as any).location_id).filter(Boolean))] as string[];
        const locs: Record<string, string> = {};
        if (locIds.length) {
          const { data: ld } = await supabase.from("cm_locations").select("id,name").in("id", locIds);
          (ld || []).forEach((l: { id: string; name: string | null }) => {
            locs[l.id] = l.name || "Location";
          });
        }
        setTaskTitles(titles);
        setUserDisplayNames(names);
        setLocationNames(locs);
        setRows(sortChangeRequestsForCoordinatorQueue(rowsData));
      }
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center gap-2 text-muted-foreground ${compact ? "py-8" : "py-12"}`}>
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading change requests…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p
        className={`text-sm text-muted-foreground text-center border rounded-md bg-muted/20 ${
          compact ? "py-4 px-3" : "py-6"
        }`}
      >
        No change requests for this event yet. Collaborators can submit from{" "}
        <span className="font-medium text-foreground">Project Management → Collaborator</span>. Event owners can add
        one from <span className="font-medium text-foreground">Manage Event</span> (Change Management on that event) or
        from <span className="font-medium text-foreground">Project Management → Task</span> where your role allows it.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!rightsLoading && !canApproveChangeRequests ? (
        <Alert>
          <AlertDescription>
            You can review change requests for this event. Only the <strong>event owner</strong> or a user with{" "}
            <strong>coordinator</strong> (or admin) permission can approve or reject them.
          </AlertDescription>
        </Alert>
      ) : null}
      <ul className={`space-y-3 ${compact ? "" : ""}`}>
      {rows.map((r) => (
        <li
          key={r.id}
          className="rounded-lg border bg-card p-4 text-sm flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(r.status)} className="capitalize">
                {(() => {
                  const s = (r.status || "").toLowerCase();
                  if (s === "open" || s === "pending") return "Pending";
                  return (r.status || "unknown").replace(/_/g, " ");
                })()}
              </Badge>
              <Badge variant={rolloutTimingVariant(r.rollout_timing)} className="capitalize">
                {rolloutTimingLabel(r.rollout_timing)}
              </Badge>
              {r.priority_tag ? (
                <Badge variant="outline" className="capitalize">
                  Task priority: {r.priority_tag}
                </Badge>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {format(new Date(r.created_at), "MMM d, yyyy · h:mm a")}
              </span>
            </div>
            {r.requested_by ? (
              <p className="text-xs text-muted-foreground">
                Submitted by{" "}
                <span className="text-foreground font-medium">
                  {userDisplayNames[r.requested_by]?.trim() || "Member"}
                </span>
                {r.location_id && locationNames[r.location_id] ? (
                  <> at <span className="text-foreground font-medium">{locationNames[r.location_id]}</span></>
                ) : null}
                {(r.device_info as any)?.platform ? (
                  <> via <span className="capitalize">{(r.device_info as any).platform}</span></>
                ) : null}
              </p>
            ) : null}
            {r.resolved_at || r.resolved_by ? (
              <p className="text-xs text-muted-foreground">
                {r.resolved_at ? (
                  <>Resolved {format(new Date(r.resolved_at), "MMM d, yyyy · h:mm a")}</>
                ) : (
                  <>Resolved</>
                )}
                {r.resolved_by ? (
                  <>
                    {" "}
                    by{" "}
                    <span className="text-foreground font-medium">
                      {userDisplayNames[r.resolved_by]?.trim() || "Member"}
                    </span>
                  </>
                ) : null}
              </p>
            ) : null}
            {r.description ? (
              <p className="text-foreground break-words">{r.description}</p>
            ) : (
              <p className="text-muted-foreground italic">No description</p>
            )}
            {r.field_changed ? (
              <p className="text-xs text-muted-foreground">
                Area: <span className="text-foreground">{r.field_changed}</span>
              </p>
            ) : null}
            {(() => {
              const interp = buildChangeRequestInterpretation({
                taskTitle: r.task_id ? taskTitles[r.task_id] : null,
                description: r.description,
                fieldChanged: r.field_changed,
                event: interpretCtx,
              });
              return (
                <div className="rounded-md bg-muted/40 border px-2 py-2 text-xs space-y-2 min-w-0">
                  <div className="font-medium text-foreground">Request interpretation</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 min-w-0">
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-muted-foreground">Event</div>
                      <div className="text-foreground break-words">{interp.eventTitle || "—"}</div>
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-muted-foreground">Event date</div>
                      <div className="text-foreground break-words">{interp.eventDate || "—"}</div>
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-muted-foreground">Change type</div>
                      <div className="text-foreground break-words">{interp.changeType || "—"}</div>
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-muted-foreground">Theme</div>
                      <div className="text-foreground break-words">{interp.themeName || "—"}</div>
                    </div>
                    <div className="sm:col-span-2 min-w-0 space-y-0.5">
                      <div className="text-muted-foreground">Category</div>
                      <div className="text-foreground break-words">{interp.categoryName || "—"}</div>
                    </div>
                    {interp.subject ? (
                      <div className="sm:col-span-2 min-w-0 space-y-0.5">
                        <div className="text-muted-foreground">Subject</div>
                        <div className="text-foreground break-words">{interp.subject}</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })()}
            {r.task_id ? (
              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Linked to a task in Task Management.</span>
                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                  <Link
                    to={`/dashboard/project-management?eventId=${encodeURIComponent(eventId)}&tab=tasks&taskId=${encodeURIComponent(r.task_id)}`}
                  >
                    Open this task
                  </Link>
                </Button>
              </p>
            ) : null}
            {r.new_value != null || r.old_value != null ? (
              <p className="text-xs text-muted-foreground">
                {r.field_changed ? `${r.field_changed}: ` : "Change: "}
                <span className="text-foreground">
                  {r.old_value != null ? String(r.old_value) : "—"} → {r.new_value != null ? String(r.new_value) : "—"}
                </span>
              </p>
            ) : null}
            {r.status === "open" || r.status === "pending" ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {canApproveChangeRequests && !rightsLoading ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={actingId === r.id}
                  onClick={async () => {
                    setActingId(r.id);
                    try {
                      const applied = await applyChangeRequestToEvent({
                        event_id: r.event_id ?? eventId,
                        task_id: r.task_id,
                        field_changed: r.field_changed,
                        new_value: r.new_value,
                        old_value: r.old_value,
                      });
                      if (!applied.ok) {
                        const rawMsg = (applied.message || "").trim();
                        toast({
                          title: "Could not apply change",
                          description: rawMsg
                            ? plannerSafeErrorToastDescription({ message: rawMsg }, commentsPlannerCopy.toastGeneric)
                            : commentsPlannerCopy.toastGeneric,
                          variant: "destructive",
                        });
                        return;
                      }
                      const { error } = await supabase
                        .from("cm_change_requests")
                        .update({
                          status: "approved",
                          resolved_at: new Date().toISOString(),
                          resolved_by: user?.id ?? null,
                        })
                        .eq("id", r.id);
                      if (error) {
                        const details = plannerSafeErrorToastDescription(error, commentsPlannerCopy.toastGeneric);
                        toast({
                          title: "Could not mark request approved",
                          description: `${details} If the event or task already changed, the update may have been applied—refresh this list to confirm the request status.`,
                        });
                        void load();
                        return;
                      }
                      const desc =
                        applied.appliedTo === "task"
                          ? "Task fields were updated where supported."
                          : applied.appliedTo === "event"
                            ? "Event details were updated where supported."
                            : "Request approved. Unsupported fields are not auto-applied.";
                      toast({ title: "Approved", description: desc });
                      if (r.requested_by) {
                        await supabase.from("notifications").insert({
                          recipient_id: r.requested_by,
                          sender_id: user?.id ?? null,
                          title: "Change request approved",
                          message: `Your change request was approved${r.description ? `: ${r.description}` : ""}.`,
                          type: "change_request_approved",
                          entity_type: "change_request",
                          entity_id: r.id,
                          event_id: r.event_id ?? eventId ?? null,
                        });
                      }
                      window.dispatchEvent(
                        new CustomEvent("iep-change-requests-updated", {
                          detail: { eventId: r.event_id ?? eventId },
                        }),
                      );
                      void load();
                    } catch (e) {
                      toast({
                        title: "Approve failed",
                        description: plannerSafeErrorToastDescription(e, commentsPlannerCopy.toastGeneric),
                        variant: "destructive",
                      });
                    } finally {
                      setActingId(null);
                    }
                  }}
                >
                  Approve
                </Button>
                ) : null}
                {canApproveChangeRequests && !rightsLoading ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={actingId === r.id}
                  onClick={async () => {
                    setActingId(r.id);
                    try {
                      const { error } = await supabase
                        .from("cm_change_requests")
                        .update({
                          status: "rejected",
                          resolved_at: new Date().toISOString(),
                          resolved_by: user?.id ?? null,
                        })
                        .eq("id", r.id);
                      if (error) {
                        toast({
                          title: "Could not reject change request",
                          description: plannerSafeErrorToastDescription(error, commentsPlannerCopy.toastGeneric),
                          variant: "destructive",
                        });
                        void load();
                        return;
                      }
                      toast({ title: "Rejected", description: "Change request was rejected." });
                      if (r.requested_by) {
                        await supabase.from("notifications").insert({
                          recipient_id: r.requested_by,
                          sender_id: user?.id ?? null,
                          title: "Change request declined",
                          message: `Your change request was declined${r.description ? `: ${r.description}` : ""}.`,
                          type: "change_request_rejected",
                          entity_type: "change_request",
                          entity_id: r.id,
                          event_id: r.event_id ?? eventId ?? null,
                        });
                      }
                      window.dispatchEvent(
                        new CustomEvent("iep-change-requests-updated", {
                          detail: { eventId: r.event_id ?? eventId },
                        }),
                      );
                      void load();
                    } catch (e) {
                      toast({
                        title: "Reject failed",
                        description: plannerSafeErrorToastDescription(e, commentsPlannerCopy.toastGeneric),
                        variant: "destructive",
                      });
                    } finally {
                      setActingId(null);
                    }
                  }}
                >
                  Reject
                </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
    </div>
  );
}
