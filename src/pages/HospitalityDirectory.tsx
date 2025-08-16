import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Hotel, Home, MapPin, Coffee } from "lucide-react";

const HospitalityDirectory = () => {
  const [hospitalityTypes, setHospitalityTypes] = useState<any[]>([]);
  const [selectedHospitalityType, setSelectedHospitalityType] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHospitalityTypes();
  }, []);

  const fetchHospitalityTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('Hospitality Directory')
        .select('*');
      
      if (error) {
        console.error('Error fetching hospitality types:', error);
      } else {
        setHospitalityTypes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const hospitalityTypeOptions = [
    { value: "hotel", label: "Hotel", icon: Hotel },
    { value: "motel", label: "Motel", icon: Home },
    { value: "airbnb", label: "Airbnb", icon: Home },
    { value: "resort", label: "Resort", icon: MapPin },
    { value: "other", label: "Other", icon: Coffee }
  ];

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
          <CardTitle>Select Hospitality Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Hospitality Type</label>
            <Select value={selectedHospitalityType} onValueChange={setSelectedHospitalityType}>
              <SelectTrigger className="w-full bg-background border-border">
                <SelectValue placeholder="Select a hospitality type..." />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {hospitalityTypeOptions.map((option) => {
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
          
          {selectedHospitalityType && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Hospitality Type:</h3>
              <p className="text-sm text-muted-foreground">
                {hospitalityTypeOptions.find(opt => opt.value === selectedHospitalityType)?.label}
              </p>
            </div>
          )}

          <Button 
            onClick={() => setSelectedHospitalityType("")} 
            variant="outline"
            disabled={!selectedHospitalityType}
          >
            Clear Selection
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hospitality Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {loading ? 'Loading hospitality data...' : 'No hospitality profiles found. Add providers to see them here.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HospitalityDirectory;