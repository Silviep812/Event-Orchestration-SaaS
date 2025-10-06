import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { confirmationSchema } from "@/lib/validation/bookingsValidation";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Event {
  userid: string;
  event_start_date: string;
  event_start_time: string;
  event_end_time: string;
  event_location: string[];
  event_theme: string[];
  event_description: string;
}

const ConfirmationForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedConfirmation, setGeneratedConfirmation] = useState<string | null>(null);

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
      // Auto-generate confirmation number
      const confirmationNumber = `CONF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const validatedData = confirmationSchema.parse({
        confirmation_number: confirmationNumber,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        notes: formData.notes || undefined,
      });

      const bookId = `conf_${Date.now()}`;
      const { error: confirmError } = await supabase
        .from('confirmation_submissions')
        .insert([{
          book_id: bookId,
          event_id: selectedEventId,
          confirmation_number: validatedData.confirmation_number,
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          notes: validatedData.notes,
        }]);

      if (confirmError) throw confirmError;

      // Update Bookings Directory if user is authenticated
      if (user) {
        const { error: directoryError } = await supabase
          .from('Bookings Directory')
          .upsert({
            book_id: `booking_${user.id}`,
            user_id: user.id,
            confirmation: true,
          }, {
            onConflict: 'book_id',
          });

        if (directoryError) console.error('Directory update error:', directoryError);
      }

      setGeneratedConfirmation(confirmationNumber);
      
      toast({
        title: "Confirmation Received",
        description: `Your confirmation number is: ${confirmationNumber}`,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        notes: ""
      });
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
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-primary/20 shadow-lg">
      <CardHeader className="space-y-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <CheckCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Booking Confirmation</CardTitle>
            <CardDescription className="text-base">Please confirm your booking details</CardDescription>
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

        {selectedEvent && (
          <div className="mb-8 p-6 bg-muted/50 rounded-lg border border-border space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Event Details
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
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
                    {selectedEvent.event_location?.[0] || 'Location TBD'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div className="mb-8 p-6 bg-muted/50 rounded-lg border border-border text-center">
            <p className="text-muted-foreground">No events found. Please create an event first.</p>
          </div>
        )}

        {generatedConfirmation && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium text-primary mb-1">Your Confirmation Number:</p>
            <p className="text-2xl font-bold text-primary tracking-wide">{generatedConfirmation}</p>
            <p className="text-xs text-muted-foreground mt-2">Please save this number for your records</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
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
              <Label htmlFor="email">Email Address *</Label>
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
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                className="border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any special requests or questions?"
              value={formData.notes}
              onChange={handleChange}
              className="min-h-[100px] border-border resize-none"
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
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 h-12 text-base"
              disabled={isSubmitting}
              onClick={() => {
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  notes: ""
                });
                setErrors({});
                setGeneratedConfirmation(null);
              }}
            >
              Clear Form
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> By confirming, you agree to attend the event at the specified date and time. 
            If you need to make changes, please contact the event organizer.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmationForm;
