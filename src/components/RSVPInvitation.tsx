import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { CheckCircle, XCircle, HelpCircle, Calendar, MapPin, Clock, User, Mail, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RSVPInvitation = () => {
  const { toast } = useToast();
  const [response, setResponse] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [specialRequests, setSpecialRequests] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response || !guestName || !guestEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "RSVP Submitted",
      description: "Thank you for your response!",
    });

    // Reset form
    setResponse("");
    setGuestName("");
    setGuestEmail("");
    setGuestCount("1");
    setSpecialRequests("");
  };

  const responseOptions = [
    {
      value: "attending",
      label: "Joyfully Accept",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      value: "not-attending",
      label: "Regretfully Decline",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      value: "maybe",
      label: "Tentatively Accept",
      icon: HelpCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
  ];

  return (
    <Card className="max-w-3xl mx-auto border-none shadow-lg bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="text-center space-y-4 pb-8">
        <div className="inline-block mx-auto p-3 bg-primary/10 rounded-full">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          You're Invited!
        </CardTitle>
        <CardDescription className="text-base md:text-lg">
          We would be delighted to have you join us for our special event
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-card rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-semibold">March 15, 2025</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-semibold">6:00 PM</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Venue</p>
              <p className="font-semibold">Grand Ballroom</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Response Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Your Response *</Label>
            <RadioGroup value={response} onValueChange={setResponse} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {responseOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = response === option.value;
                return (
                  <div key={option.value} className="relative">
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={option.value}
                      className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? `${option.borderColor} ${option.bgColor} shadow-md scale-105`
                          : "border-border hover:border-primary/50 hover:shadow-sm"
                      }`}
                    >
                      <IconComponent className={`w-8 h-8 ${isSelected ? option.color : "text-muted-foreground"}`} />
                      <span className={`font-medium text-sm ${isSelected ? option.color : ""}`}>
                        {option.label}
                      </span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Guest Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name *
              </Label>
              <Input
                id="guestName"
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="border-2 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address *
              </Label>
              <Input
                id="guestEmail"
                type="email"
                placeholder="your.email@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="border-2 focus:border-primary"
              />
            </div>
          </div>

          {/* Number of Guests */}
          {response === "attending" && (
            <div className="space-y-2">
              <Label htmlFor="guestCount" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Number of Guests
              </Label>
              <Input
                id="guestCount"
                type="number"
                min="1"
                max="10"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="border-2 focus:border-primary max-w-xs"
              />
            </div>
          )}

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="specialRequests">
              Dietary Restrictions or Special Requests
            </Label>
            <Textarea
              id="specialRequests"
              placeholder="Please let us know if you have any dietary restrictions or special requests..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="border-2 focus:border-primary min-h-24 resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full md:w-auto md:px-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
          >
            Submit RSVP
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center pt-4">
          * Required fields. Please respond by March 1, 2025
        </p>
      </CardContent>
    </Card>
  );
};

export default RSVPInvitation;
