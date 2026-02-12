import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QrCode, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { qrCodeSchema } from "@/lib/validation/bookingsValidation";
import { useAuth } from "@/hooks/useAuth";

const QRCodeForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    eventName: "",
    ticketNumber: "",
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
      if (!formData.ticketNumber) {
        throw new Error("Please generate a QR code number first");
      }

      const validatedData = qrCodeSchema.parse({
        event_name: formData.eventName,
        ticket_number: formData.ticketNumber,
        email: formData.email,
        phone: formData.phone || undefined,
        notes: formData.notes || undefined,
      });

      const bookId = `bar_${Date.now()}`;
      const { error: qrCodeError } = await supabase
        .from('qrcode_submissions')
        .insert([{
          book_id: bookId,
          event_name: validatedData.event_name,
          ticket_number: validatedData.ticket_number,
          email: validatedData.email,
          phone: validatedData.phone,
          notes: validatedData.notes,
        }]);

      if (qrCodeError) throw qrCodeError;

      // Update Bookings Directory if user is authenticated
      if (user) {
        const { error: directoryError } = await supabase
          .from('Bookings Directory')
          .upsert({
            book_id: `booking_${user.id}`,
            user_id: user.id,
            QR_Code: true,
          }, {
            onConflict: 'book_id',
          });

        if (directoryError) console.error('Directory update error:', directoryError);
      }

      toast({
        title: "QR Code Generated",
        description: "Your event QR code has been generated successfully.",
      });

      setFormData({
        eventName: "",
        ticketNumber: "",
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
  };

  const generateQRCode = () => {
    const qrCodeNumber = `BC${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setFormData({
      ...formData,
      ticketNumber: qrCodeNumber
    });
    toast({
      title: "QR Code Number Generated",
      description: `Generated: ${qrCodeNumber}`,
    });
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              placeholder="Enter event name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticketNumber">Ticket/QR Code Number</Label>
            <div className="flex gap-2">
              <Input
                id="ticketNumber"
                name="ticketNumber"
                value={formData.ticketNumber}
                onChange={handleChange}
                placeholder="Generated QR code number"
                readOnly
              />
              <Button type="button" onClick={generateQRCode} variant="outline">
                Generate
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(123) 456-7890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special requirements or notes..."
              rows={3}
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

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Generate QR Code
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              disabled={isSubmitting}
              onClick={() => {
                setFormData({
                  eventName: "",
                  ticketNumber: "",
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

        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-2">QR Code Information:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Generate a unique QR code for event entry tracking</li>
            <li>Use the generated number for ticket validation</li>
            <li>Keep your QR code safe for event check-in</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeForm;
