import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const VenueDirectory = () => {
  const [venueTypes, setVenueTypes] = useState<any[]>([]);
  const [selectedVenueType, setSelectedVenueType] = useState<string>("");
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
          <CardTitle>Select Venue Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Venue Type</label>
            <Select value={selectedVenueType} onValueChange={setSelectedVenueType}>
              <SelectTrigger className="w-full bg-background border-border">
                <SelectValue placeholder="Select a venue type..." />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {venueTypeOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="hover:bg-muted cursor-pointer"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedVenueType && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Venue Type:</h3>
              <p className="text-sm text-muted-foreground">
                {venueTypeOptions.find(opt => opt.value === selectedVenueType)?.label}
              </p>
            </div>
          )}

          <Button 
            onClick={() => setSelectedVenueType("")} 
            variant="outline"
            disabled={!selectedVenueType}
          >
            Clear Selection
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