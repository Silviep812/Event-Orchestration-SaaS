import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Clock, MapPin, Users } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLifecycleTableBadge } from "@/lib/eventStatus";
import { useCreateEventEntryPath } from "@/hooks/useCreateEventEntryPath";
import { plannerToolsCopy } from "@/lib/nudges";

interface Event {
  id: string;
  title: string;
  date: Date;
  start_date: string | null;
  end_date: string | null;
  archived: boolean;
  start_time: string;
  location: string;
  type: "meeting" | "event" | "deadline" | "other";
  attendees: number;
  description?: string;
  status: string | null;
}

const EventCalendar = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const createEventPath = useCreateEventEntryPath();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's events from the database
  const fetchUserEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Transform database events to component format
      const transformedEvents: Event[] = data?.map((event) => {
        const start = event.start_date
          ? parseISO(String(event.start_date).split("T")[0])
          : new Date();
        return {
          id: event.id,
          title: event.title,
          date: start,
          start_date: event.start_date,
          end_date: event.end_date ?? null,
          archived: !!event.archived,
          start_time: event.start_time ? event.start_time.slice(0, 5) : "",
          location: event.venue || "TBD",
          type: getEventTypeFromDatabase("general"),
          attendees: event.expected_attendees || 0,
          description: event.description || "",
          status: event.status ?? null,
        };
      }) || [];

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: plannerToolsCopy.calendarLoadFailed,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map database event types to component types
  const getEventTypeFromDatabase = (dbType: string): "meeting" | "event" | "deadline" | "other" => {
    const typeMap: Record<string, "meeting" | "event" | "deadline" | "other"> = {
      'meeting': 'meeting',
      'conference': 'event',
      'workshop': 'event',
      'deadline': 'deadline',
      'celebration': 'event',
      'corporate': 'event',
      'social': 'event'
    };
    return typeMap[dbType?.toLowerCase()] || 'event';
  };

  useEffect(() => {
    fetchUserEvents();
  }, [user]);

  // const getEventTypeColor = (type: string) => {
  //   switch (type) {
  //     case "meeting": return "bg-blue-500";
  //     case "event": return "bg-green-500";
  //     case "deadline": return "bg-red-500";
  //     default: return "bg-gray-500";
  //   }
  // };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const getDatesWithEvents = () => {
    return events.map(event => event.date);
  };


  const eventsForSelectedDate = selectedDate ? getEventsForDate(selectedDate) : [];

  // Filter for upcoming events only
  const now = new Date();
  const upcomingEvents = events.filter(event => {
    const eventStart = event.date;
    return eventStart >= now;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Event Calendar</h2>
          <p className="text-muted-foreground">Manage and track your events and important dates</p>
        </div>
        <Button onClick={() => navigate(createEventPath)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex justify-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar View
              </CardTitle>
              <CardDescription className="flex justify-center">
                Click on a date to view events or schedule new ones
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasEvent: getDatesWithEvents()
                }}
                modifiersClassNames={{
                  hasEvent: "bg-primary/20 text-primary font-semibold"
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Select a Date"}
              </CardTitle>
              <CardDescription>
                {eventsForSelectedDate.length > 0 
                  ? `${eventsForSelectedDate.length} event(s) scheduled`
                  : "No events scheduled"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventsForSelectedDate.length > 0 ? (
                <div className="space-y-3">
                  {eventsForSelectedDate.map((event) => {
                    const lifecycleBadge = getLifecycleTableBadge({
                      status: event.status,
                      start_date: event.start_date,
                      end_date: event.end_date,
                      archived: event.archived,
                    });
                    return (
                    <div key={event.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{event.title}</h4>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.start_time}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                        {event.attendees > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.attendees} attendees
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                        <Badge variant={lifecycleBadge.variant} className="text-xs capitalize">
                          {lifecycleBadge.label}
                        </Badge>
                      </div>
                    </div>
                  );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No events scheduled for this date</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate(createEventPath)}
                  >
                    Add Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Next 3 scheduled events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.date && format(event.date, "MMM dd")}
                        {event.start_time ? ' at ' + event.start_time : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;