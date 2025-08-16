import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VenueDirectory = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Venue Directory</h1>
        <p className="text-muted-foreground">
          Browse and manage event venues
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venue Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Venue directory functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueDirectory;