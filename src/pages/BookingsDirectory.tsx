import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle, Clock } from "lucide-react";

const BookingsDirectory = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBookingType, setSelectedBookingType] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('Bookings Directory')
        .select('*');
      
      if (error) {
        console.error('Error fetching bookings:', error);
      } else {
        setBookings(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const bookingTypeOptions = [
    { value: "reservation", label: "Reservation", icon: Calendar },
    { value: "confirmation", label: "Confirmation", icon: CheckCircle },
    { value: "rsvp", label: "RSVP", icon: Clock },
    { value: "registry", label: "Registry", icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings Directory</h1>
        <p className="text-muted-foreground">
          Manage your event bookings and reservations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Booking Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Booking Type</label>
            <Select value={selectedBookingType} onValueChange={setSelectedBookingType}>
              <SelectTrigger className="w-full bg-background border-border">
                <SelectValue placeholder="Select a booking type..." />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {bookingTypeOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="hover:bg-muted cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent size={16} />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          {selectedBookingType && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Booking Type:</h3>
              <p className="text-sm text-muted-foreground">
                {bookingTypeOptions.find(opt => opt.value === selectedBookingType)?.label}
              </p>
            </div>
          )}

          <Button 
            onClick={() => setSelectedBookingType("")} 
            variant="outline"
            disabled={!selectedBookingType}
          >
            Clear Selection
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {loading ? 'Loading booking data...' : 'No bookings found. Create new bookings to see them here.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsDirectory;