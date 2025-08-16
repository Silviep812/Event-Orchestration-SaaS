import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VendorServiceDirectory = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Service Rental/Buy Directory</h1>
        <p className="text-muted-foreground">
          Browse vendor services and rental options
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Service Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Vendor service directory functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorServiceDirectory;