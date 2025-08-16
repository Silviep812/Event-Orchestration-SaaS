import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bus, Car, Truck, Crown, Package } from "lucide-react";

const TransportationDirectory = () => {
  const [transportationTypes, setTransportationTypes] = useState<any[]>([]);
  const [selectedTransportationType, setSelectedTransportationType] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransportationTypes();
  }, []);

  const fetchTransportationTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('Transportation Directory')
        .select('*');
      
      if (error) {
        console.error('Error fetching transportation types:', error);
      } else {
        setTransportationTypes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const transportationTypeOptions = [
    { value: "bus", label: "Bus", icon: Bus },
    { value: "van", label: "Van", icon: Car },
    { value: "car_suv", label: "Car/SUV", icon: Car },
    { value: "limo", label: "Limousine", icon: Crown },
    { value: "truck", label: "Truck", icon: Truck },
    { value: "other", label: "Other", icon: Package }
  ];

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
          <CardTitle>Select Transportation Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Transportation Type</label>
            <Select value={selectedTransportationType} onValueChange={setSelectedTransportationType}>
              <SelectTrigger className="w-full bg-background border-border">
                <SelectValue placeholder="Select a transportation type..." />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {transportationTypeOptions.map((option) => {
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
          
          {selectedTransportationType && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Transportation Type:</h3>
              <p className="text-sm text-muted-foreground">
                {transportationTypeOptions.find(opt => opt.value === selectedTransportationType)?.label}
              </p>
            </div>
          )}

          <Button 
            onClick={() => setSelectedTransportationType("")} 
            variant="outline"
            disabled={!selectedTransportationType}
          >
            Clear Selection
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transportation Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {loading ? 'Loading transportation data...' : 'No transportation profiles found. Add providers to see them here.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransportationDirectory;