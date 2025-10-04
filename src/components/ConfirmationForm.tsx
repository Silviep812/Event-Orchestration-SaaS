import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { confirmationSchema } from "@/lib/validation/bookingsValidation";

const ConfirmationForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    confirmationNumber: "",
    name: "",
    email: "",
    phone: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const validatedData = confirmationSchema.parse({
        confirmation_number: formData.confirmationNumber,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        notes: formData.notes || undefined,
      });

      const { error } = await supabase
        .from('confirmation_submissions')
        .insert([{
          book_id: `conf_${Date.now()}`,
          confirmation_number: validatedData.confirmation_number,
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          notes: validatedData.notes,
        }]);

      if (error) throw error;

      toast({
        title: "Confirmation Received",
        description: "Your booking has been confirmed successfully.",
      });

      setFormData({
        confirmationNumber: "",
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
              disabled={isSubmitting}
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
                  confirmationNumber: "",
                  name: "",
                  email: "",
                  phone: "",
                  notes: ""
                });
                setErrors({});
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
