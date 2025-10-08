import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string;
}

interface EventSelectorProps {
  onSelectEvent: (eventId: string) => void;
  selectedEvent?: string;
}

export function EventSelector({ onSelectEvent, selectedEvent }: EventSelectorProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { updateWorkflowSelections } = useWorkflow();
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        // Fetch all events
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("id, user_id, title, description")
          .eq("user_id", user.id)
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
  }, [user, toast]);

  const handleSelectEvent = async (eventId: string) => {
    // Check if workflow exists for this event (regardless of user)
    const { data: existingWorkflow } = await supabase
      .from('workflows')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();
    
    if (!existingWorkflow && user?.id) {
      // Create new workflow record for this event with change tracking
      await updateWorkflowSelections({ event_id: eventId });
    }
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
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">There are currently no events available. Please create an event or review your workflow dashboard for more details.</p>
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
            Choose which event you want to set up a workflow for
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
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
        ))}
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
