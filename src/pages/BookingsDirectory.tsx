import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle, Clock, QrCode } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import RSVPInvitation from "@/components/RSVPInvitation";
import ConfirmationForm from "@/components/ConfirmationForm";
import ReservationForm from "@/components/ReservationForm";
import RegistryForm from "@/components/RegistryForm";
import QRCodeForm from "@/components/QRCodeForm";

const BookingsDirectory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBookingTypes, setSelectedBookingTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionCounts, setSubmissionCounts] = useState({
    rsvp: 0,
    confirmation: 0,
    reservation: 0,
    registry: 0,
    qrCode: 0,
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Extract venue data from navigation state
  const venueData = location.state as {
    venueId?: string;
    venueName?: string;
    venueLocation?: string;
    venueCapacity?: number;
    venueTypeId?: string;
    venueTypeName?: string;
    isPrivateResidence?: boolean;
    autoSelectReservation?: boolean;
    autoSelectRSVP?: boolean;
  } | null;

  useEffect(() => {
    fetchBookings();
    fetchSubmissionCounts();
    
    // Auto-select booking type based on venue type
    if (venueData?.autoSelectRSVP && !selectedBookingTypes.includes('rsvp')) {
      setSelectedBookingTypes(['rsvp']);
    } else if (venueData?.autoSelectReservation && !selectedBookingTypes.includes('reservation')) {
      setSelectedBookingTypes(['reservation']);
    }
  }, []);

  const fetchSubmissionCounts = async () => {
    try {
      const [rsvpRes, confirmRes, reservRes, regRes, qrCodeRes] = await Promise.all([
        supabase.from('rsvp_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('confirmation_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('reservation_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('registry_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('qrcode_submissions').select('id', { count: 'exact', head: true }),
      ]);

      setSubmissionCounts({
        rsvp: rsvpRes.count || 0,
        confirmation: confirmRes.count || 0,
        reservation: reservRes.count || 0,
        registry: regRes.count || 0,
        qrCode: qrCodeRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching submission counts:', error);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('Bookings Directory')
        .select('*')
        .eq('user_id', user.id);
      
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
    { value: "registry", label: "Registry", icon: Calendar },
    { value: "qrCode", label: "QR Code", icon: QrCode }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings Directory</h1>
        <p className="text-muted-foreground">
          Manage your event bookings and reservations
        </p>
        {venueData && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
            <h3 className="font-semibold mb-2">Booking for:</h3>
            <div className="flex items-center gap-2">
              {venueData.isPrivateResidence && <Badge variant="secondary">Private Residence</Badge>}
              <span className="font-medium">{venueData.venueName}</span>
            </div>
            {venueData.venueLocation && (
              <p className="text-sm text-muted-foreground mt-1">{venueData.venueLocation}</p>
            )}
          </div>
        )}
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

      {selectedBookingTypes.includes('reservation') && (
        <div className="animate-fade-in">
          <ReservationForm 
            venueId={venueData?.venueId}
            venueName={venueData?.venueName}
            venueLocation={venueData?.venueLocation}
            venueCapacity={venueData?.venueCapacity}
          />
        </div>
      )}

      {selectedBookingTypes.includes('rsvp') && (
        <div className="animate-fade-in">
          <RSVPInvitation 
            isPrivateResidence={venueData?.isPrivateResidence}
            venueName={venueData?.venueName}
            venueLocation={venueData?.venueLocation}
          />
        </div>
      )}

      {selectedBookingTypes.includes('confirmation') && (
        <div className="animate-fade-in">
          <ConfirmationForm />
        </div>
      )}

      {selectedBookingTypes.includes('registry') && (
        <div className="animate-fade-in">
          <RegistryForm />
        </div>
      )}

      {selectedBookingTypes.includes('qrCode') && (
        <div className="animate-fade-in">
          <QRCodeForm />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Booking Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <Clock className="w-6 h-6 text-primary mb-2" />
              <span className="text-2xl font-bold">{submissionCounts.rsvp}</span>
              <span className="text-sm text-muted-foreground">RSVPs</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <CheckCircle className="w-6 h-6 text-primary mb-2" />
              <span className="text-2xl font-bold">{submissionCounts.confirmation}</span>
              <span className="text-sm text-muted-foreground">Confirmations</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <Calendar className="w-6 h-6 text-primary mb-2" />
              <span className="text-2xl font-bold">{submissionCounts.reservation}</span>
              <span className="text-sm text-muted-foreground">Reservations</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <Calendar className="w-6 h-6 text-primary mb-2" />
              <span className="text-2xl font-bold">{submissionCounts.registry}</span>
              <span className="text-sm text-muted-foreground">Registry</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <QrCode className="w-6 h-6 text-primary mb-2" />
              <span className="text-2xl font-bold">{submissionCounts.qrCode}</span>
              <span className="text-sm text-muted-foreground">QR Codes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              {loading ? 'Loading submission data...' : `Total submissions across all booking types: ${Object.values(submissionCounts).reduce((a, b) => a + b, 0)}`}
            </p>
            <p className="text-sm text-muted-foreground">
              Submissions are securely stored and can be reviewed through your admin panel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsDirectory;