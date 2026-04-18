import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BarChart3, ClipboardList, ExternalLink, RefreshCw, Workflow } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import {
  commentsPlannerCopy,
  plannerSafeErrorToastDescription,
} from "@/lib/nudges";
import { EventChangeRequestsList } from "@/components/change-management/EventChangeRequestsList";

interface ChangeManagementPanelProps {
  selectedEventFilter: string;
}

export function ChangeManagementPanel({ selectedEventFilter }: ChangeManagementPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [listRefresh, setListRefresh] = useState(0);
  const [urgentOpenCount, setUrgentOpenCount] = useState(0);
  const [auditType, setAuditType] = useState("cm_note");
  const [auditBody, setAuditBody] = useState("");
  const [auditSaving, setAuditSaving] = useState(false);

  const eventId = selectedEventFilter !== "all" ? selectedEventFilter : null;

  useEffect(() => {
    if (!eventId) return;
    const onCmUpdated = (ev: Event) => {
      const detail = (ev as CustomEvent<{ eventId?: string }>).detail;
      if (detail?.eventId !== eventId) return;
      setListRefresh((r) => r + 1);
    };
    window.addEventListener("iep-change-requests-updated", onCmUpdated);
    return () => window.removeEventListener("iep-change-requests-updated", onCmUpdated);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setUrgentOpenCount(0);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { count, error } = await supabase
        .from("cm_change_requests")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("rollout_timing", "urgent")
        .in("status", ["open", "pending"]);
      if (cancelled) return;
      if (error) {
        console.warn("urgent change request count:", error);
        setUrgentOpenCount(0);
        return;
      }
      setUrgentOpenCount(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, listRefresh]);

  const submitCmAuditNote = async () => {
    if (!eventId || !user?.id) return;
    const body = auditBody.trim();
    if (!body) {
      toast({ title: "Add a note", description: "Enter text for the CM audit entry.", variant: "destructive" });
      return;
    }
    setAuditSaving(true);
    try {
      const { error } = await supabase.from("cm_audit_events").insert({
        event_id: eventId,
        user_id: user.id,
        type: auditType.trim() || "cm_note",
        description: body,
        payload: { source: "change_management_panel" },
      });
      if (error) throw error;
      toast({
        title: "CM audit log updated",
        description: "Your note was recorded for this event.",
      });
      setAuditBody("");
    } catch (e) {
      toast({
        title: "Could not save CM audit entry",
        description: plannerSafeErrorToastDescription(e, commentsPlannerCopy.toastGeneric),
        variant: "destructive",
      });
    } finally {
      setAuditSaving(false);
    }
  };

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
              items linked to tasks. Related tasks appear under{" "}
              <strong>Project Management → Task</strong>. For a full audit trail, use{" "}
              <strong>Manage Event → Change Log</strong>.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setListRefresh((n) => n + 1)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/manage-event?eventId=${encodeURIComponent(eventId)}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage Event (change log)
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {urgentOpenCount > 0 ? (
            <Alert variant="destructive">
              <AlertTitle>Open urgent change requests</AlertTitle>
              <AlertDescription>
                {urgentOpenCount === 1
                  ? "There is 1 open request marked Urgent for this event. Review it below and in Manage Event."
                  : `There are ${urgentOpenCount} open requests marked Urgent for this event. Review them below and in Manage Event.`}
              </AlertDescription>
            </Alert>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Approve or reject open requests. Approving applies the requested update to the event or linked task when
            that change is supported. Rejecting closes the request without applying updates.
          </p>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card className="shadow-none border bg-muted/20">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Analytics for this event</CardTitle>
                <CardDescription className="text-xs">
                  KPIs and charts filtered to the current event.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/dashboard/analytics?eventId=${encodeURIComponent(eventId)}`}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Open scoped analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="shadow-none border bg-muted/20">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Guided workflow</CardTitle>
                <CardDescription className="text-xs">
                  Step through theme, venue, hospitality, and suppliers in order for this event.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/dashboard/workflow-dashboard?eventId=${encodeURIComponent(eventId)}`}>
                    <Workflow className="h-4 w-4 mr-2" />
                    Open workflow for this event
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="shadow-none border bg-muted/20 md:col-span-2 xl:col-span-1">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Append CM audit entry</CardTitle>
                <CardDescription className="text-xs">
                  Record coordination notes in the CM audit trail for this event.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">Entry type</Label>
                  <Input value={auditType} onChange={(e) => setAuditType(e.target.value)} placeholder="cm_note" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Note</Label>
                  <Textarea
                    value={auditBody}
                    onChange={(e) => setAuditBody(e.target.value)}
                    rows={3}
                    placeholder="What should the CM audit trail capture?"
                  />
                </div>
                <Button type="button" size="sm" disabled={auditSaving} onClick={() => void submitCmAuditNote()}>
                  {auditSaving ? "Saving…" : "Save to CM audit log"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <EventChangeRequestsList eventId={eventId} refreshToken={listRefresh} />
        </CardContent>
      </Card>
    </div>
  );
}
