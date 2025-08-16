import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle, Clock } from "lucide-react";

const BookingsDirectory = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBookingTypes, setSelectedBookingTypes] = useState<string[]>([]);
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
          <CardTitle>Select Booking Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Booking Types (select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bookingTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isChecked = selectedBookingTypes.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedBookingTypes([...selectedBookingTypes, option.value]);
                        } else {
                          setSelectedBookingTypes(selectedBookingTypes.filter(type => type !== option.value));
                        }
                      }}
                    />
                    <label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <IconComponent size={16} />
                      {option.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          
          {selectedBookingTypes.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Booking Types:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedBookingTypes.map(type => (
                  <span key={type} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {bookingTypeOptions.find(opt => opt.value === type)?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={() => setSelectedBookingTypes([])} 
            variant="outline"
            disabled={selectedBookingTypes.length === 0}
          >
            Clear All Selections
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