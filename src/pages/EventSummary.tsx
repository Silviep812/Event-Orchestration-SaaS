import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { getLifecycleTableBadge } from "@/lib/eventStatus";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export default function EventSummary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(() => Boolean(new URLSearchParams(window.location.search).get("eventId")));
  const [confirming, setConfirming] = useState(false);
  const [myEvents, setMyEvents] = useState<Pick<EventRow, "id" | "title" | "start_date">[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setEvent(null);
    (async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setEvent(null);
      } else {
        setEvent(data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, toast]);

  useEffect(() => {
    if (eventId || !user?.id) return;
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      const { data, error } = await supabase
        .from("events")
        .select("id, title, start_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setLoadingList(false);
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          setMyEvents(data ?? []);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, user?.id, toast]);

  const confirmEvent = async () => {
    if (!eventId) return;
    setConfirming(true);
    const { error } = await supabase
      .from("events")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", eventId);
    setConfirming(false);
    if (error) {
      toast({ title: "Could not confirm", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Event confirmed", description: "Your event is marked as confirmed." });
    setEvent((e) => (e ? { ...e, status: "confirmed" } : e));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="container max-w-2xl p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Event summary</h1>
          <p className="text-muted-foreground mt-2">
            Choose an event below, or open this page from Manage Event after selecting an event there.
          </p>
        </div>
        {loadingList ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : myEvents.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myEvents.map((ev) => (
                <Button
                  key={ev.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => setSearchParams({ eventId: ev.id })}
                >
                  <span className="text-left">
                    <span className="font-medium block">{ev.title || "Untitled event"}</span>
                    {ev.start_date ? (
                      <span className="text-xs text-muted-foreground">{ev.start_date}</span>
                    ) : null}
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>
        ) : user ? (
          <p className="text-muted-foreground">You don&apos;t have any events yet. Create one first.</p>
        ) : (
          <p className="text-muted-foreground">Sign in to view your events.</p>
        )}
        <Button variant="outline" onClick={() => navigate("/dashboard/manage-event")}>
          Go to Manage Event
        </Button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container max-w-2xl p-6 space-y-4">
        <p className="text-muted-foreground">
          This event was not found, or you don&apos;t have access. Check the link or pick another event.
        </p>
        <Button variant="outline" onClick={() => navigate("/dashboard/event-summary")}>
          Choose another event
        </Button>
      </div>
    );
  }

  const lifecycleBadge = getLifecycleTableBadge({
    status: event.status,
    start_date: event.start_date,
    end_date: event.end_date,
    archived: event.archived,
  });

  return (
    <div className="container max-w-3xl p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Event summary</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={lifecycleBadge.variant} className="capitalize">
              {lifecycleBadge.label}
            </Badge>
          </p>
          <p>
            <span className="text-muted-foreground">Dates:</span> {event.start_date}
            {event.end_date ? ` → ${event.end_date}` : ""}
          </p>
          <p>
            <span className="text-muted-foreground">Venue:</span> {event.venue}
          </p>
          {event.description ? (
            <p>
              <span className="text-muted-foreground">Description:</span> {event.description}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={() => navigate(`/dashboard/manage-event?eventId=${eventId}`)}
          variant="outline"
        >
          Edit in Manage Event
        </Button>
        <Button onClick={confirmEvent} disabled={confirming || event.status === "confirmed"}>
          {confirming ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Confirm event
        </Button>
      </div>
    </div>
  );
}
