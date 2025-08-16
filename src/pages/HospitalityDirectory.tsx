import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HospitalityDirectory = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hospitality Directory</h1>
        <p className="text-muted-foreground">
          Manage hospitality services and accommodations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hospitality Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Hospitality directory functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HospitalityDirectory;