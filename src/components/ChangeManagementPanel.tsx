import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { applyChangeRequestToEvent } from "@/lib/applyChangeRequestToEvent";
import {
  commentsPlannerCopy,
  plannerSafeErrorToastDescription,
  plannerToolsCopy,
} from "@/lib/nudges";

type ChangeRequestRow = {
  id: string;
  created_at: string;
  description: string | null;
  field_changed: string | null;
  status: string | null;
  priority_tag: string | null;
  task_id: string | null;
  event_id: string | null;
  new_value: string | null;
  old_value: string | null;
};

interface ChangeManagementPanelProps {
  selectedEventFilter: string;
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

export function ChangeManagementPanel({ selectedEventFilter }: ChangeManagementPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rows, setRows] = useState<ChangeRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const eventId = selectedEventFilter !== "all" ? selectedEventFilter : null;

  const load = useCallback(async () => {
    if (!eventId) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("cm_change_requests")
      .select(
        "id, created_at, description, field_changed, status, priority_tag, task_id, event_id, new_value, old_value",
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("cm_change_requests:", error);
      toast({
        title: "Could not load change requests",
        description: plannerSafeErrorToastDescription(error, plannerToolsCopy.changeManagementLoadFailed),
        variant: "destructive",
      });
      setRows([]);
    } else {
      setRows((data ?? []) as ChangeRequestRow[]);
    }
    setLoading(false);
  }, [eventId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!eventId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Change requests for this event
          </CardTitle>
          <CardDescription>
            Choose an event with <strong>Filter by Event</strong> above to review and act on change
            requests for that event.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Change requests
            </CardTitle>
            <CardDescription>
              Requests that affect this event—updates from collaborators, event detail changes, and
              items linked to tasks. Related tasks also appear under{" "}
              <strong>Project Management → Tasks</strong>. For a full audit trail, use{" "}
              <strong>Manage Event → Change History</strong>.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => void load()}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/manage-event?eventId=${encodeURIComponent(eventId)}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Full change log in Manage Event
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Approve or reject open requests. Approving applies the requested update to the event when that change is
            supported. Rejecting closes the request without changing the event.
          </p>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center border rounded-md bg-muted/20">
              No change requests for this event yet. Submit one from <strong>Team</strong> (Collaborate), or update the
              event in <strong>Manage Event</strong>.
            </p>
          ) : (
            <ul className="space-y-3">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border bg-card p-4 text-sm flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(r.status)} className="capitalize">
                        {r.status?.replace(/_/g, " ") || "unknown"}
                      </Badge>
                      {r.priority_tag ? (
                        <Badge variant="outline" className="capitalize">
                          {r.priority_tag}
                        </Badge>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(r.created_at), "MMM d, yyyy · h:mm a")}
                      </span>
                    </div>
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
                    {r.task_id ? (
                      <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>Linked to a task in Task Management.</span>
                        <Button variant="link" className="h-auto p-0 text-xs" asChild>
                          <Link
                            to={`/dashboard/project-management?eventId=${encodeURIComponent(eventId)}&tab=tasks`}
                          >
                            Open in Tasks
                          </Link>
                        </Button>
                      </p>
                    ) : null}
                    {r.new_value != null || r.old_value != null ? (
                      <p className="text-xs text-muted-foreground">
                        {r.field_changed ? `${r.field_changed}: ` : "Change: "}
                        <span className="text-foreground">
                          {r.old_value != null ? String(r.old_value) : "—"} →{" "}
                          {r.new_value != null ? String(r.new_value) : "—"}
                        </span>
                      </p>
                    ) : null}
                    {r.status === "open" || r.status === "pending" ? (
                      <div className="flex flex-wrap gap-2 pt-2">
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
                              });
                              if (!applied.ok) {
                                const rawMsg = (applied.message || "").trim();
                                toast({
                                  title: "Could not apply change",
                                  description: rawMsg
                                    ? plannerSafeErrorToastDescription(
                                        { message: rawMsg },
                                        commentsPlannerCopy.toastGeneric,
                                      )
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
                              if (error) throw error;
                              const desc =
                                applied.appliedTo === "task"
                                  ? "Task fields were updated in Task Management where supported."
                                  : applied.appliedTo === "event"
                                    ? "Event details were updated where supported."
                                    : "Request approved. Unsupported fields are not auto-applied to events or tasks.";
                              toast({
                                title: "Approved",
                                description: desc,
                              });
                              void load();
                            } catch (e) {
                              toast({
                                title: "Error",
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
                              if (error) throw error;
                              toast({ title: "Rejected", description: "Change request was rejected." });
                              void load();
                            } catch (e) {
                              toast({
                                title: "Error",
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
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
