import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QrCode } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const BarCodeForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    eventName: "",
    ticketNumber: "",
    email: "",
    phone: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Barcode Generated",
      description: "Your event barcode has been generated successfully.",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateBarcode = () => {
    const barcodeNumber = `BC${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setFormData({
      ...formData,
      ticketNumber: barcodeNumber
    });
    toast({
      title: "Barcode Number Generated",
      description: `Generated: ${barcodeNumber}`,
    });
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          BarCode Generator
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
            <Label htmlFor="ticketNumber">Ticket/Barcode Number</Label>
            <div className="flex gap-2">
              <Input
                id="ticketNumber"
                name="ticketNumber"
                value={formData.ticketNumber}
                onChange={handleChange}
                placeholder="Generated barcode number"
                readOnly
              />
              <Button type="button" onClick={generateBarcode} variant="outline">
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

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              <QrCode className="mr-2 h-4 w-4" />
              Generate Barcode
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setFormData({
                eventName: "",
                ticketNumber: "",
                email: "",
                phone: "",
                notes: ""
              })}
            >
              Clear Form
            </Button>
          </div>
        </form>

        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-2">Barcode Information:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Generate a unique barcode for event entry tracking</li>
            <li>Use the generated number for ticket validation</li>
            <li>Keep your barcode safe for event check-in</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarCodeForm;
