import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Clock, MapPin, Users } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  type: "meeting" | "event" | "deadline" | "other";
  attendees: number;
  description?: string;
  status: "planned" | "in-progress" | "completed" | "cancelled";
}

const EventCalendar = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: "",
    time: "",
    location: "",
    type: "event" as const,
    attendees: 0,
    description: ""
  });

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
      const transformedEvents: Event[] = data?.map(event => ({
        id: event.id,
        title: event.title,
        date: parseISO(event.start_date),
        time: format(parseISO(event.start_date), 'HH:mm'),
        location: event.venue || 'TBD',
        type: getEventTypeFromDatabase(event.event_type),
        attendees: event.expected_attendees || 0,
        description: event.description || '',
        status: 'planned' as const
      })) || [];

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your events.",
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
    return typeMap[dbType?.toLowerCase()] || 'other';
  };

  useEffect(() => {
    fetchUserEvents();
  }, [user]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting": return "bg-blue-500";
      case "event": return "bg-green-500";
      case "deadline": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600";
      case "in-progress": return "text-blue-600";
      case "cancelled": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const getDatesWithEvents = () => {
    return events.map(event => event.date);
  };

  const handleCreateEvent = async () => {
    if (!selectedDate || !newEvent.title || !newEvent.time || !user) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Combine date and time
      const eventDateTime = new Date(selectedDate);
      const [hours, minutes] = newEvent.time.split(':');
      eventDateTime.setHours(parseInt(hours), parseInt(minutes));

      // Create end time (default to 1 hour later if no end time specified)
      const endDateTime = new Date(eventDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1);

      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        event_type: newEvent.type,
        start_date: eventDateTime.toISOString().split('T')[0], // Date only
        end_date: endDateTime.toISOString().split('T')[0], // Date only
        start_time: eventDateTime.toISOString(), // Full timestamp with timezone
        end_time: endDateTime.toISOString(), // Full timestamp with timezone
        venue: newEvent.location,
        expected_attendees: newEvent.attendees,
        user_id: user.id,
        tags: [newEvent.type]
      };

      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) throw error;

      toast({
        title: "Event Created",
        description: `${newEvent.title} has been scheduled for ${format(selectedDate, "MMM dd, yyyy")}.`,
      });

      // Refresh events list
      fetchUserEvents();

      setNewEvent({
        title: "",
        time: "",
        location: "",
        type: "event",
        attendees: 0,
        description: ""
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const eventsForSelectedDate = selectedDate ? getEventsForDate(selectedDate) : [];

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Event title *"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Attendees"
                  value={newEvent.attendees || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, attendees: parseInt(e.target.value) || 0 })}
                />
              </div>
              <Input
                placeholder="Location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
              <Select value={newEvent.type} onValueChange={(value: any) => setNewEvent({ ...newEvent, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Description (optional)"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
              <Button onClick={handleCreateEvent} className="w-full">
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar View
              </CardTitle>
              <CardDescription>
                Click on a date to view events or schedule new ones
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  {eventsForSelectedDate.map((event) => (
                    <div key={event.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{event.title}</h4>
                        <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`} />
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
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
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                        <span className={`text-xs font-medium ${getStatusColor(event.status)}`}>
                          {event.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No events scheduled for this date</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setIsDialogOpen(true)}
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
                {events.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(event.date, "MMM dd")} at {event.time}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`} />
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