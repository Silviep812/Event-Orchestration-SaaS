import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarIcon, Plus, Clock, MapPin, Users, Video } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLifecycleTableBadge } from "@/lib/eventStatus";
import { useCreateEventEntryPath } from "@/hooks/useCreateEventEntryPath";
import { commentsPlannerCopy, plannerSafeErrorToastDescription, plannerToolsCopy } from "@/lib/nudges";
import { deriveCalendarEntryKind, stripCalendarKindPrefix } from "@/lib/calendarEntryKind";

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
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingTime, setMeetingTime] = useState("09:00");
  const [meetingVenue, setMeetingVenue] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingAttendees, setMeetingAttendees] = useState("2");
  const [savingMeeting, setSavingMeeting] = useState(false);

  // Fetch user's events from the database
  const fetchUserEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(
          "id, title, start_date, end_date, archived, start_time, venue, expected_attendees, description, status, theme_id, type_id, event_types ( name )",
        )
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Transform database events to component format
      const transformedEvents: Event[] = (data || []).map((event: any) => {
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
          type: deriveCalendarEntryKind({
            title: event.title,
            status: event.status,
            event_types: event.event_types,
          }),
          attendees: event.expected_attendees || 0,
          description: event.description || "",
          status: event.status ?? null,
        };
      });

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

  const saveMeetingToCalendar = async () => {
    if (!user) return;
    if (!selectedDate) {
      toast({ title: "Pick a date", description: "Select a day on the calendar first.", variant: "destructive" });
      return;
    }
    setSavingMeeting(true);
    try {
      const { data: last, error: lastErr } = await supabase
        .from("events")
        .select("theme_id, type_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastErr) throw lastErr;
      if (!last?.theme_id || !last?.type_id) {
        toast({
          title: "Create an event first",
          description: "We use your most recent event’s theme and category as defaults for quick meetings.",
        });
        navigate(createEventPath);
        setMeetingOpen(false);
        return;
      }
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const titleBase = meetingTitle.trim() || "Planning meeting";
      const attendeesNum = Math.max(1, parseInt(String(meetingAttendees).trim(), 10) || 2);
      const { error: insErr } = await supabase.from("events").insert({
        user_id: user.id,
        title: `[Meeting] ${titleBase}`,
        theme_id: last.theme_id,
        type_id: last.type_id,
        venue: meetingVenue.trim() || "TBD",
        location: meetingVenue.trim() || null,
        start_date: dateStr,
        end_date: dateStr,
        start_time: meetingTime ? `${meetingTime}:00` : "09:00:00",
        budget: 0,
        expected_attendees: attendeesNum,
        description: meetingNotes.trim() || "Scheduled from Calendar.",
        venue_booking_completed: false,
      });
      if (insErr) throw insErr;
      toast({ title: "Meeting scheduled", description: "It appears on your calendar and in Manage Event." });
      setMeetingOpen(false);
      setMeetingTitle("");
      setMeetingNotes("");
      setMeetingVenue("");
      setMeetingAttendees("2");
      await fetchUserEvents();
    } catch (e) {
      toast({
        title: "Could not schedule meeting",
        description: plannerSafeErrorToastDescription(e, commentsPlannerCopy.toastGeneric),
        variant: "destructive",
      });
    } finally {
      setSavingMeeting(false);
    }
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
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setMeetingOpen(true)}>
            <Video className="h-4 w-4 mr-2" />
            Schedule meeting
          </Button>
          <Button type="button" onClick={() => navigate(createEventPath)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
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
                        <h4 className="font-semibold text-sm">{stripCalendarKindPrefix(event.title)}</h4>
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
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <Button variant="outline" size="sm" type="button" onClick={() => setMeetingOpen(true)}>
                      Schedule meeting
                    </Button>
                    <Button variant="outline" size="sm" type="button" onClick={() => navigate(createEventPath)}>
                      Add Event
                    </Button>
                  </div>
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
                      <p className="font-medium text-sm">{stripCalendarKindPrefix(event.title)}</p>
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

      <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a meeting</DialogTitle>
            <DialogDescription>
              Creates a calendar entry for {selectedDate ? format(selectedDate, "MMM d, yyyy") : "the selected day"}.
              Theme and category default to your most recent event so you can book working sessions quickly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-2">
              <Label htmlFor="meet-title">Title</Label>
              <Input
                id="meet-title"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g. Site walkthrough"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meet-time">Start time</Label>
              <Input
                id="meet-time"
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meet-venue">Venue / room</Label>
              <Input
                id="meet-venue"
                value={meetingVenue}
                onChange={(e) => setMeetingVenue(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meet-att">Expected attendees</Label>
              <Input
                id="meet-att"
                type="number"
                min={1}
                value={meetingAttendees}
                onChange={(e) => setMeetingAttendees(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meet-notes">Notes (optional)</Label>
              <Textarea
                id="meet-notes"
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                rows={3}
                placeholder="Dial-in, agenda, parking…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setMeetingOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveMeetingToCalendar()} disabled={savingMeeting}>
              {savingMeeting ? "Saving…" : "Save meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCalendar;