import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TransportationDirectory = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transportation Directory</h1>
        <p className="text-muted-foreground">
          Manage transportation services and options
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transportation Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Transportation directory functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransportationDirectory;