import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Calendar, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ConfirmationForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    confirmationNumber: "",
    name: "",
    email: "",
    phone: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Confirmation Received",
      description: "Your booking has been confirmed successfully.",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
                <p className="text-muted-foreground">Saturday, March 15, 2025</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-muted-foreground">6:00 PM - 11:00 PM</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 md:col-span-2">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">Grand Event Center, 123 Main Street</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="confirmationNumber">Confirmation Number *</Label>
              <Input
                id="confirmationNumber"
                name="confirmationNumber"
                placeholder="Enter confirmation number"
                value={formData.confirmationNumber}
                onChange={handleChange}
                required
                className="border-border"
              />
            </div>

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

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Button 
              type="submit" 
              className="flex-1 h-12 text-base font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirm Booking
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 h-12 text-base"
              onClick={() => {
                setFormData({
                  confirmationNumber: "",
                  name: "",
                  email: "",
                  phone: "",
                  notes: ""
                });
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
