import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building, Home, Utensils, MapPin, Trees, Dumbbell, Warehouse, Users, Building2, Hotel, ShoppingBag, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VenueDirectory = () => {
  const [venueProfiles, setVenueProfiles] = useState<any[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch venue profiles from Supabase
  useEffect(() => {
    fetchVenueProfiles();
  }, []);

  const fetchVenueProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('venues')
        .select('*');

      if (error) {
        console.error('Error fetching venue profiles:', error);
        toast({
          title: "Error",
          description: "Failed to load venue profiles. Please try again.",
          variant: "destructive"
        });
      } else {
        setVenueProfiles(data || []);
      }
    } catch (error) {
      console.error('Error fetching venue profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load venue profiles. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Map venue type IDs to readable types
  const mapVenueTypeId = (typeId: string) => {
    const typeMap: { [key: string]: string } = {
      'private_resident': 'private_resident',
      'business_location': 'business_location', 
      'restaurant_location': 'restaurant_location',
      'resort_location': 'resort_location',
      'recreation_location': 'recreation_location',
      'private_club': 'private_club',
      'market_place': 'market_place',
      'local_govern_location': 'local_govern_location',
      'hospitality_location': 'hospitality_location',
      'agri_farming': 'agri_farming',
      'warehouse': 'warehouse',
      'state_govern_location': 'state_govern_location',
      'sporting_facility': 'sporting_facility',
      'other': 'other'
    };
    return typeMap[typeId] || 'other';
  };

  // Filter profiles based on selected venue types
  const filteredProfiles = selectedVenueTypes.length > 0 
    ? venueProfiles.filter(profile => selectedVenueTypes.includes(mapVenueTypeId(profile.venue_type_id)))
    : venueProfiles;

  const venueTypeOptions = [
    { value: "private_resident", label: "Private Resident", icon: Home },
    { value: "business_location", label: "Business Location", icon: Building },
    { value: "restaurant_location", label: "Restaurant Location", icon: Utensils },
    { value: "resort_location", label: "Resort Location", icon: Hotel },
    { value: "recreation_location", label: "Recreation Location", icon: Trees },
    { value: "private_club", label: "Private Club", icon: Users },
    { value: "market_place", label: "Market Place", icon: ShoppingBag },
    { value: "local_govern_location", label: "Local Government Location", icon: Building2 },
    { value: "hospitality_location", label: "Hospitality Location", icon: Hotel },
    { value: "agri_farming", label: "Agri-Farming", icon: Trees },
    { value: "warehouse", label: "Warehouse", icon: Warehouse },
    { value: "state_govern_location", label: "State Government Location", icon: Building2 },
    { value: "sporting_facility", label: "Sporting Facility", icon: Dumbbell },
    { value: "other", label: "Other", icon: HelpCircle }
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
                const IconComponent = option.icon;
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
                    <label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <IconComponent size={16} />
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
          <CardTitle>Venue Profiles ({filteredProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">
              Loading venue profiles...
            </p>
          ) : filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No venue profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const mappedType = mapVenueTypeId(profile.venue_type_id);
                const typeOption = venueTypeOptions.find(opt => opt.value === mappedType);
                const IconComponent = typeOption?.icon || HelpCircle;
                
                return (
                  <Card key={profile.created_at} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{profile.business_name || 'Venue Name'}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {typeOption?.label || 'Other'}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-semibold">{profile.contact_name}</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.phone_number ? `(${String(profile.phone_number).slice(0,3)}) ${String(profile.phone_number).slice(3,6)}-${String(profile.phone_number).slice(6)}` : 'No phone provided'}
                        </p>
                      </div>
                      
                      <div className="text-sm">
                        {profile.ven_price && (
                          <p><strong>Price:</strong> ${profile.ven_price}</p>
                        )}
                        {profile.capacity && (
                          <p><strong>Capacity:</strong> {profile.capacity} guests</p>
                        )}
                        <p><strong>Location:</strong> {[profile.city, profile.state, profile.zip].join(', ') || 'Location not specified'}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueDirectory;