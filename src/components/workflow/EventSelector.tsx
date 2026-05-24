import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getLifecycleTableBadge } from "@/lib/eventStatus";

interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  archived?: boolean | null;
}

interface EventSelectorProps {
  onSelectEvent: (eventId: string) => void;
  selectedEvent?: string;
  /** Bump when workflows/events change so the list of events-without-workflow refetches */
  refreshKey?: number;
}

export function EventSelector({ onSelectEvent, selectedEvent, refreshKey = 0 }: EventSelectorProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        // Fetch all events
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("id, user_id, title, description, status, archived")
          .eq("user_id", user.id)
          .neq("archived", true)
          .not("status", "in", "(completed,archived,cancelled)")
          .order("start_date", { ascending: true });


        if (eventsError) throw eventsError;

        // Fetch existing workflows to filter out events that already have workflows
        const { data: workflowsData, error: workflowsError } = await supabase
          .from("workflows")
          .select("event_id")
          .eq("user_id", user.id);

        if (workflowsError) throw workflowsError;

        // Get event IDs that already have workflows
        const eventIdsWithWorkflows = new Set(
          workflowsData?.map(w => w.event_id).filter(Boolean) || []
        );

        // Filter out events that already have workflows
        const availableEvents = (eventsData || []).filter(
          event => !eventIdsWithWorkflows.has(event.id)
        );

        setEvents(availableEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user, toast, refreshKey]);

  const handleSelectEvent = (eventId: string) => {
    onSelectEvent(eventId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading your events...</p>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-2">
          <p className="text-muted-foreground">
            No events are available for a new workflow. Each event can have only one workflow—events that already have one are hidden here.
          </p>
          <p className="text-sm text-muted-foreground">
            Create a new event (or finish an in-progress wizard), then return to this step to attach a workflow.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select an Event</CardTitle>
          <CardDescription>
            Only events that do not already have a workflow are listed. One workflow per event.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const lifecycleBadge = getLifecycleTableBadge({
            status: event.status,
            start_date: event.start_date,
            end_date: event.end_date,
            archived: event.archived,
          });
          return (
          <Card
            key={event.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedEvent === event.id
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:border-primary/50"
            }`}
            onClick={() => handleSelectEvent(event.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {event.title || "Untitled Event"}
                  </CardTitle>
                  <Badge variant={lifecycleBadge.variant} className="mt-2 capitalize text-xs">
                    {lifecycleBadge.label}
                  </Badge>
                  <CardDescription className="mt-2">
                    {event.description}
                  </CardDescription>
                </div>
                {selectedEvent === event.id && (
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </div>
            </CardHeader>
          </Card>
          );
        })}
      </div>

      {selectedEvent && (
        <div className="flex justify-end">
          <Button onClick={() => handleSelectEvent(selectedEvent)} size="lg">
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
