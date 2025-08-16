import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const VenueDirectory = () => {
  const [venueTypes, setVenueTypes] = useState<any[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVenueTypes();
  }, []);

  const fetchVenueTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('Venue Directory')
        .select('*');
      
      if (error) {
        console.error('Error fetching venue types:', error);
      } else {
        setVenueTypes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const venueTypeOptions = [
    { value: "private_resident", label: "Private Resident" },
    { value: "business_location", label: "Business Location" },
    { value: "restaurant_location", label: "Restaurant Location" },
    { value: "resort_location", label: "Resort Location" },
    { value: "recreation_location", label: "Recreation Location" },
    { value: "private_club", label: "Private Club" },
    { value: "market_place", label: "Market Place" },
    { value: "local_govern_location", label: "Local Government Location" },
    { value: "hospitality_location", label: "Hospitality Location" },
    { value: "agri_farming", label: "Agri-Farming" },
    { value: "warehouse", label: "Warehouse" },
    { value: "state_govern_location", label: "State Government Location" },
    { value: "sporting_facility", label: "Sporting Facility" },
    { value: "other", label: "Other" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Venue Directory</h1>
        <p className="text-muted-foreground">
          Browse and manage event venues
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Venue Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Venue Types (select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {venueTypeOptions.map((option) => {
                const isChecked = selectedVenueTypes.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedVenueTypes([...selectedVenueTypes, option.value]);
                        } else {
                          setSelectedVenueTypes(selectedVenueTypes.filter(type => type !== option.value));
                        }
                      }}
                    />
                    <label htmlFor={option.value} className="cursor-pointer text-sm font-medium">
                      {option.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          
          {selectedVenueTypes.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Venue Types:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedVenueTypes.map(type => (
                  <span key={type} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {venueTypeOptions.find(opt => opt.value === type)?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={() => setSelectedVenueTypes([])} 
            variant="outline"
            disabled={selectedVenueTypes.length === 0}
          >
            Clear All Selections
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Venue Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {loading ? 'Loading venue data...' : 'No venue profiles found. Add venues to see them here.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueDirectory;