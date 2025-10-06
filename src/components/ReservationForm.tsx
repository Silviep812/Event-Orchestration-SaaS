import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Users, MapPin, Phone, Mail, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/useAuth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { reservationSchema } from "@/lib/validation/bookingsValidation";

interface ReservationFormProps {
  venueId?: string;
  venueName?: string;
  venueLocation?: string;
  venueCapacity?: number;
}

interface Event {
  userid: string;
  event_start_date: string;
  event_start_time: string;
  event_end_time: string;
  event_location: string[];
  event_theme: string[];
  event_description: string;
}

const ReservationForm = ({ venueId, venueName, venueLocation, venueCapacity }: ReservationFormProps = {}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    partySize: "",
    time: "",
    specialRequests: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('Create Event')
      .select('*')
      .eq('userid', user.id);
    
    if (error) {
      console.error('Error fetching events:', error);
      return;
    }
    
    setEvents(data || []);
    if (data && data.length > 0) {
      setSelectedEventId(data[0].userid);
      setSelectedEvent(data[0]);
    }
  };

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = events.find(e => e.userid === eventId);
    setSelectedEvent(event || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      if (!date) {
        throw new Error("Please select a date");
      }

      const validatedData = reservationSchema.parse({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        party_size: parseInt(formData.partySize),
        preferred_date: format(date, "yyyy-MM-dd"),
        preferred_time: formData.time,
        special_requests: formData.specialRequests || undefined,
      });

      const bookId = `res_${Date.now()}`;
      const { error: reservationError } = await supabase
        .from('reservation_submissions')
        .insert([{
          book_id: bookId,
          event_id: selectedEventId,
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          party_size: validatedData.party_size,
          preferred_date: validatedData.preferred_date,
          preferred_time: validatedData.preferred_time,
          special_requests: validatedData.special_requests,
          venue_id: venueId || null,
        }]);

      if (reservationError) throw reservationError;

      // Update Bookings Directory if user is authenticated
      if (user) {
        const { error: directoryError } = await supabase
          .from('Bookings Directory')
          .upsert({
            book_id: `booking_${user.id}`,
            user_id: user.id,
            reservation: true,
          }, {
            onConflict: 'book_id',
          });

        if (directoryError) console.error('Directory update error:', directoryError);
      }

      toast({
        title: "Reservation Submitted",
        description: "We'll confirm your reservation shortly via email.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        partySize: "",
        time: "",
        specialRequests: ""
      });
      setDate(undefined);
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        toast({
          title: "Validation Error",
          description: "Please check the form and try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission Failed",
          description: error.message || "An error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errors[e.target.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
  };

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
    "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"
  ];

  return (
    <Card className="max-w-3xl mx-auto border-primary/20 shadow-lg">
      <CardHeader className="space-y-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Make a Reservation</CardTitle>
            <CardDescription className="text-base">Reserve your spot for an unforgettable experience</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 md:p-8">
        {events.length > 0 && (
          <div className="mb-6">
            <Label htmlFor="event-select">Select Event *</Label>
            <Select value={selectedEventId} onValueChange={handleEventChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.userid} value={event.userid}>
                    {event.event_theme?.[0] || 'Event'} - {event.event_start_date ? format(new Date(event.event_start_date), 'MMM dd, yyyy') : 'No date'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedEvent ? (
          <div className="mb-8 p-6 bg-muted/50 rounded-lg border border-border space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Event Details
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <CalendarIcon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-muted-foreground">
                    {selectedEvent.event_start_date ? format(new Date(selectedEvent.event_start_date), 'EEEE, MMMM dd, yyyy') : 'No date set'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-muted-foreground">
                    {selectedEvent.event_start_time && selectedEvent.event_end_time 
                      ? `${format(new Date(selectedEvent.event_start_time), 'h:mm a')} - ${format(new Date(selectedEvent.event_end_time), 'h:mm a')}`
                      : 'Time TBD'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 md:col-span-2">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">
                    {selectedEvent.event_location?.[0] || venueName || venueLocation || 'Location TBD'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="mb-8 p-6 bg-muted/50 rounded-lg border border-border text-center">
            <p className="text-muted-foreground">No events found. Please create an event first.</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Full Name *
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                required
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partySize" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Party Size *
              </Label>
              <Input
                id="partySize"
                name="partySize"
                type="number"
                min="1"
                placeholder="Number of guests"
                value={formData.partySize}
                onChange={handleChange}
                required
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Preferred Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-border",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Preferred Time *
              </Label>
              <select
                id="time"
                name="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                required
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests or Dietary Requirements</Label>
            <Textarea
              id="specialRequests"
              name="specialRequests"
              placeholder="Any special arrangements, accessibility needs, or dietary restrictions?"
              value={formData.specialRequests}
              onChange={handleChange}
              className="min-h-[120px] border-border resize-none"
            />
          </div>

          {/* Error Messages */}
          {Object.keys(errors).length > 0 && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside text-sm text-destructive space-y-1">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedEventId}
              className="flex-1 h-12 text-base font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Submit Reservation
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              disabled={isSubmitting}
              className="flex-1 h-12 text-base"
              onClick={() => {
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  partySize: "",
                  time: "",
                  specialRequests: ""
                });
                setDate(undefined);
                setErrors({});
              }}
            >
              Clear Form
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <strong>Cancellation Policy:</strong> Reservations can be cancelled up to 24 hours before the scheduled time. 
            You'll receive a confirmation email within 2 hours of submission.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReservationForm;
