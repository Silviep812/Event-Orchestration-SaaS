import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bus, Car, Truck, Crown, Package } from "lucide-react";

const TransportationDirectory = () => {
  const [transportationTypes, setTransportationTypes] = useState<any[]>([]);
  const [selectedTransportationTypes, setSelectedTransportationTypes] = useState<string[]>([]);
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
          <CardTitle>Select Transportation Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Transportation Types (select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {transportationTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isChecked = selectedTransportationTypes.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTransportationTypes([...selectedTransportationTypes, option.value]);
                        } else {
                          setSelectedTransportationTypes(selectedTransportationTypes.filter(type => type !== option.value));
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
          
          {selectedTransportationTypes.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Transportation Types:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTransportationTypes.map(type => (
                  <span key={type} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {transportationTypeOptions.find(opt => opt.value === type)?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={() => setSelectedTransportationTypes([])} 
            variant="outline"
            disabled={selectedTransportationTypes.length === 0}
          >
            Clear All Selections
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