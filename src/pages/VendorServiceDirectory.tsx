import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Camera, Lightbulb, Music, Gamepad2, Flower, Home, Table } from "lucide-react";

const VendorServiceDirectory = () => {
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('Service Rental/Sale Directory')
        .select('*');
      
      if (error) {
        console.error('Error fetching service types:', error);
      } else {
        setServiceTypes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const serviceTypeOptions = [
    { value: "transport_options", label: "Transportation", icon: Truck },
    { value: "photo_booth", label: "Photo Booth", icon: Camera },
    { value: "lighting", label: "Lighting", icon: Lightbulb },
    { value: "audio_visual_equip", label: "Audio Visual Equipment", icon: Music },
    { value: "game_tables", label: "Game Tables", icon: Gamepad2 },
    { value: "flowers_plants", label: "Flowers & Plants", icon: Flower },
    { value: "tents", label: "Tents", icon: Home },
    { value: "table_chairs", label: "Tables & Chairs", icon: Table },
    { value: "housewares", label: "Housewares", icon: Home },
    { value: "entertainment_options", label: "Entertainment Options", icon: Music }
  ];

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
          <CardTitle>Select Service Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Service Type</label>
            <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
              <SelectTrigger className="w-full bg-background border-border">
                <SelectValue placeholder="Select a service type..." />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {serviceTypeOptions.map((option) => {
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
          
          {selectedServiceType && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Service Type:</h3>
              <p className="text-sm text-muted-foreground">
                {serviceTypeOptions.find(opt => opt.value === selectedServiceType)?.label}
              </p>
            </div>
          )}

          <Button 
            onClick={() => setSelectedServiceType("")} 
            variant="outline"
            disabled={!selectedServiceType}
          >
            Clear Selection
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {loading ? 'Loading service data...' : 'No service profiles found. Add services to see them here.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorServiceDirectory;