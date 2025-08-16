import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Hotel, Home, MapPin, Coffee } from "lucide-react";

const HospitalityDirectory = () => {
  const [hospitalityTypes, setHospitalityTypes] = useState<any[]>([]);
  const [selectedHospitalityTypes, setSelectedHospitalityTypes] = useState<string[]>([]);
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
          <CardTitle>Select Hospitality Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Hospitality Types (select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hospitalityTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isChecked = selectedHospitalityTypes.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedHospitalityTypes([...selectedHospitalityTypes, option.value]);
                        } else {
                          setSelectedHospitalityTypes(selectedHospitalityTypes.filter(type => type !== option.value));
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
          
          {selectedHospitalityTypes.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Hospitality Types:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedHospitalityTypes.map(type => (
                  <span key={type} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {hospitalityTypeOptions.find(opt => opt.value === type)?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={() => setSelectedHospitalityTypes([])} 
            variant="outline"
            disabled={selectedHospitalityTypes.length === 0}
          >
            Clear All Selections
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