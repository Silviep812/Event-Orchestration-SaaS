import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building, Home, Utensils, MapPin, Trees, Dumbbell, Warehouse, Users, Building2, Hotel, ShoppingBag, HelpCircle, Calendar, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { VenueFormDialog } from "@/components/venues/VenueFormDialog";

const VenueDirectory = () => {
  const [venueProfiles, setVenueProfiles] = useState<any[]>([]);
  const [venueTypes, setVenueTypes] = useState<any[]>([]);
  const [selectedVenueType, setSelectedVenueType] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);

  // Fetch venue profiles and types from Supabase
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both venues and venue types
      const results = await Promise.all([
        supabase.from('venue_profiles').select('*'),
        supabase.from('venue_types').select('*')
      ]);
      const venuesResponse = results[0];
      const typesResponse = results[1];

      if (venuesResponse && venuesResponse.error) {
        console.error('Error fetching venues:', venuesResponse.error);
        toast({
          title: "Error",
          description: "Failed to load venues. Please try again.",
          variant: "destructive"
        });
      } else if (venuesResponse) {
        setVenueProfiles(venuesResponse.data || []);
      }

      if (typesResponse && typesResponse.error) {
        console.error('Error fetching venue types:', typesResponse.error);
        toast({
          title: "Error", 
          description: "Failed to load venue types. Please try again.",
          variant: "destructive"
        });
      } else if (typesResponse) {
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

  // Filter profiles based on selected venue type, location, and user_id
  const filteredProfiles = venueProfiles.filter(profile => {
    const matchesUser = !profile.user_id || (user && profile.user_id === user.id);
    const matchesType = !selectedVenueType || profile.venue_type_id === selectedVenueType;
    
    const matchesLocation = !locationFilter || 
      profile.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.state?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.zip?.toString().includes(locationFilter);
    
    return matchesUser && matchesType && matchesLocation;
  });

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
      'local parks': Trees,
      'hospitality_location': Hotel,
      'hospitality location': Hotel,
      'farm table': Trees,
      'warehouse': Warehouse,
      'state parks': Trees,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venue Directory</h1>
          <p className="text-muted-foreground">
            Browse and manage event venues
          </p>
        </div>
        <Button onClick={() => setIsAddVenueOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Venue
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Venue Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Filter by Location</label>
            <Input
              placeholder="Enter city, state, or zip code"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Venue Type</label>
            <RadioGroup value={selectedVenueType} onValueChange={setSelectedVenueType}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {venueTypeOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = selectedVenueType === option.value;
                  return (
                    <div key={option.value} className="relative">
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={option.value}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-sm font-medium ${isSelected ? "text-primary" : ""}`}>
                          {option.label}
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>
          
          {selectedVenueType && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Venue Type:</h3>
              <span className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                {venueTypeOptions.find(opt => opt.value === selectedVenueType)?.label}
              </span>
            </div>
          )}

          <Button 
            onClick={() => {
              setSelectedVenueType("");
              setLocationFilter("");
            }} 
            variant="outline"
            disabled={!selectedVenueType && !locationFilter}
          >
            Clear All Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedVenueType ? (
              <>
                {venueTypeOptions.find(opt => opt.value === selectedVenueType)?.label || 'Venue'} ({filteredProfiles.length})
              </>
            ) : (
              <>Venues ({filteredProfiles.length})</>
            )}
          </CardTitle>
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
                  <Card key={profile.id || profile.created_at} className="hover:shadow-lg transition-shadow relative overflow-visible">
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
                      
                      <div className="text-sm space-y-1">
                        {profile.cost && (
                          <p className="text-primary font-semibold text-base">
                            <strong>Cost:</strong> ${Number(profile.cost).toLocaleString()}
                          </p>
                        )}
                        {profile.capacity && (
                          <p><strong>Capacity:</strong> {profile.capacity} guests</p>
                        )}
                        <p><strong>Location:</strong> {[profile.city, profile.state, profile.zip].filter(Boolean).join(', ') || 'Location not specified'}</p>
                        {profile.amenities && profile.amenities.length > 0 && (
                          <div>
                            <div className="flex flex-wrap gap-1">
                              {profile.amenities.map((amenity: string, idx: number) => (
                                <span key={idx} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-3 border-t mt-3">
                        <Button 
                          type="button"
                          className="w-full relative z-20 pointer-events-auto"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Button clicked for venue:', profile.id, profile.business_name);
                            const locationStr = [profile.city, profile.state, profile.zip].filter(Boolean).join(', ');
                            const isPrivateResidence = venueType?.name?.toLowerCase().includes('residence');
                            try {
                              navigate('/dashboard/bookings', { 
                                state: { 
                                  venueId: profile.id,
                                  venueName: profile.business_name || 'Venue',
                                  venueLocation: locationStr,
                                  venueCapacity: profile.capacity,
                                  venueTypeId: profile.venue_type_id,
                                  venueTypeName: venueType?.name,
                                  isPrivateResidence: isPrivateResidence,
                                  autoSelectReservation: !isPrivateResidence,
                                  autoSelectRSVP: isPrivateResidence
                                }
                              });
                              console.log('Navigation initiated');
                            } catch (error) {
                              console.error('Navigation error:', error);
                            }
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Make Reservation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <VenueFormDialog
        open={isAddVenueOpen}
        onOpenChange={setIsAddVenueOpen}
        venueTypes={venueTypes}
        onVenueAdded={() => fetchData()}
      />
    </div>
  );
};

export default VenueDirectory;