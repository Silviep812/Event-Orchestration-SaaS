import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, user_id, title, description")
          .eq("user_id", user.id)
          .order("start_date", { ascending: true });

        if (error) throw error;

        setEvents(data || []);
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
  }, [user, onSelectEvent, toast]);

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
          <p className="text-muted-foreground">No events found. Please create an event first.</p>
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
            onClick={() => onSelectEvent(event.id)}
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
          <Button onClick={() => onSelectEvent(selectedEvent)} size="lg">
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
