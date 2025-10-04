import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock, Users, MapPin, Phone, Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ReservationForm = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    partySize: "",
    time: "",
    specialRequests: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Reservation Submitted",
      description: "We'll confirm your reservation shortly via email.",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
        <div className="mb-8 p-6 bg-muted/50 rounded-lg border border-border">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            Venue Information
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Location:</strong> Grand Event Center, 123 Main Street</p>
            <p><strong className="text-foreground">Available Times:</strong> 9:00 AM - 8:00 PM</p>
            <p><strong className="text-foreground">Capacity:</strong> Up to 200 guests</p>
          </div>
        </div>

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

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Button 
              type="submit" 
              className="flex-1 h-12 text-base font-semibold"
            >
              <CalendarIcon className="w-5 h-5 mr-2" />
              Submit Reservation
            </Button>
            <Button 
              type="button" 
              variant="outline" 
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
