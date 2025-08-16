import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ServiceVendorDirectory = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Vendor Supplier Directory</h1>
        <p className="text-muted-foreground">
          Manage service vendors and suppliers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Vendor Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Service vendor directory functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceVendorDirectory;