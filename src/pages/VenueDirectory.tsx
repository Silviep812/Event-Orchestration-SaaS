import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building, Home, Utensils, MapPin, Trees, Dumbbell, Warehouse, Users, Building2, Hotel, ShoppingBag, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VenueDirectory = () => {
  const [venueProfiles, setVenueProfiles] = useState<any[]>([]);
  const [venueTypes, setVenueTypes] = useState<any[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch venue profiles and types from Supabase
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both venues and venue types
      const [venuesResponse, typesResponse] = await Promise.all([
        supabase.from('venues').select('*'),
        supabase.from('venue_types').select('*')
      ]);

      if (venuesResponse.error) {
        console.error('Error fetching venues:', venuesResponse.error);
        toast({
          title: "Error",
          description: "Failed to load venues. Please try again.",
          variant: "destructive"
        });
      } else {
        setVenueProfiles(venuesResponse.data || []);
      }

      if (typesResponse.error) {
        console.error('Error fetching venue types:', typesResponse.error);
        toast({
          title: "Error", 
          description: "Failed to load venue types. Please try again.",
          variant: "destructive"
        });
      } else {
        setVenueTypes(typesResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get venue type by ID
  const getVenueTypeById = (typeId: string) => {
    return venueTypes.find(type => type.id === typeId);
  };

  // Filter profiles based on selected venue types
  const filteredProfiles = selectedVenueTypes.length > 0 
    ? venueProfiles.filter(profile => selectedVenueTypes.includes(profile.venue_type_id))
    : venueProfiles;

  // Create venue type options from fetched data
  const getIconForType = (typeName: string) => {
    const iconMap: { [key: string]: any } = {
      'private_resident': Home,
      'private resident': Home,
      'business_location': Building,
      'business location': Building,
      'restaurant_location': Utensils,
      'restaurant location': Utensils,
      'resort_location': Hotel,
      'resort location': Hotel,
      'recreation_location': Trees,
      'recreation location': Trees,
      'private_club': Users,
      'private club': Users,
      'market_place': ShoppingBag,
      'market place': ShoppingBag,
      'local_govern_location': Building2,
      'local government location': Building2,
      'hospitality_location': Hotel,
      'hospitality location': Hotel,
      'agri_farming': Trees,
      'agri farming': Trees,
      'warehouse': Warehouse,
      'state_govern_location': Building2,
      'state government location': Building2,
      'sporting_facility': Dumbbell,
      'sporting facility': Dumbbell,
      'other': HelpCircle
    };
    const normalizedName = typeName.toLowerCase().replace(/[-_]/g, ' ');
    return iconMap[normalizedName] || HelpCircle;
  };

  const venueTypeOptions = venueTypes.map(type => ({
    value: type.id,
    label: type.name,
    icon: getIconForType(type.name)
  }));

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
                const venueType = getVenueTypeById(profile.venue_type_id);
                const typeOption = venueTypeOptions.find(opt => opt.value === profile.venue_type_id);
                const IconComponent = typeOption?.icon || HelpCircle;
                
                return (
                  <Card key={profile.id || profile.created_at} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{profile.business_name || 'Venue Name'}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {venueType?.name || 'Other'}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-semibold">{profile.contact_name}</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.phone_number ? profile.phone_number : 'No phone provided'}
                        </p>
                      </div>
                      
                      <div className="text-sm">
                        {profile.price && (
                          <p><strong>Price:</strong> ${profile.price}</p>
                        )}
                        {profile.capacity && (
                          <p><strong>Capacity:</strong> {profile.capacity} guests</p>
                        )}
                        <p><strong>Location:</strong> {[profile.city, profile.state, profile.zip].filter(Boolean).join(', ') || 'Location not specified'}</p>
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