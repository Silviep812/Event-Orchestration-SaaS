import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BookingsDirectory = () => {
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
          <CardTitle>Booking Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Booking directory functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsDirectory;