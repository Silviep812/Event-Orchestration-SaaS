import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Camera, Lightbulb, Music, Gamepad2, Flower, Home, Table } from "lucide-react";

const VendorServiceDirectory = () => {
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
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
    { value: "transport_options", label: "Transportation Options", icon: Truck },
    { value: "photo_both", label: "Photo Booth", icon: Camera },
    { value: "lighting", label: "Lighting", icon: Lightbulb },
    { value: "audio_visual_equip", label: "Audio Visual Equipment", icon: Music },
    { value: "game_tables", label: "Game Tables", icon: Gamepad2 },
    { value: "flowers_plants", label: "Flowers & Plants", icon: Flower },
    { value: "tents", label: "Tents", icon: Home },
    { value: "table_chairs", label: "Tables & Chairs", icon: Table },
    { value: "housewares", label: "Housewares", icon: Home },
    { value: "entertainment_options", label: "Entertainment Options", icon: Music },
    { value: "potty_johns", label: "Portable Toilets", icon: Home },
    { value: "prod_props", label: "Production Props", icon: Camera },
    { value: "venue_space_decor", label: "Venue Space Decor", icon: Flower },
    { value: "child_play_equip", label: "Child Play Equipment", icon: Gamepad2 }
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
          <CardTitle>Select Service Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Service Types (select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {serviceTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isChecked = selectedServiceTypes.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedServiceTypes([...selectedServiceTypes, option.value]);
                        } else {
                          setSelectedServiceTypes(selectedServiceTypes.filter(type => type !== option.value));
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
          
          {selectedServiceTypes.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Service Types:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedServiceTypes.map(type => (
                  <span key={type} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {serviceTypeOptions.find(opt => opt.value === type)?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={() => setSelectedServiceTypes([])} 
            variant="outline"
            disabled={selectedServiceTypes.length === 0}
          >
            Clear All Selections
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