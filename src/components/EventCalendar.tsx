import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Clock, MapPin, Users } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    time: "",
    location: "",
    type: "event" as const,
    attendees: 0,
    description: ""
  });

  const events: Event[] = [
    {
      id: "1",
      title: "Annual Conference 2024",
      date: new Date(2024, 7, 15),
      time: "09:00 AM",
      location: "Grand Convention Center",
      type: "event",
      attendees: 250,
      description: "Annual company conference with keynote speakers",
      status: "planned"
    },
    {
      id: "2",
      title: "Team Building Workshop",
      date: new Date(2024, 7, 20),
      time: "02:00 PM",
      location: "Central Park",
      type: "event",
      attendees: 30,
      description: "Outdoor team building activities",
      status: "planned"
    },
    {
      id: "3",
      title: "Client Meeting",
      date: new Date(2024, 7, 22),
      time: "10:30 AM",
      location: "Office Conference Room",
      type: "meeting",
      attendees: 8,
      description: "Project proposal presentation",
      status: "planned"
    },
    {
      id: "4",
      title: "Budget Submission Deadline",
      date: new Date(2024, 7, 25),
      time: "11:59 PM",
      location: "Online",
      type: "deadline",
      attendees: 0,
      description: "Final budget submission for Q4",
      status: "planned"
    }
  ];

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

  const handleCreateEvent = () => {
    if (!selectedDate || !newEvent.title || !newEvent.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Event Created",
      description: `${newEvent.title} has been scheduled for ${format(selectedDate, "MMM dd, yyyy")}.`,
    });

    setNewEvent({
      title: "",
      time: "",
      location: "",
      type: "event",
      attendees: 0,
      description: ""
    });
    setIsDialogOpen(false);
  };

  const eventsForSelectedDate = selectedDate ? getEventsForDate(selectedDate) : [];

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