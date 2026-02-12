import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bus, Car, Truck, Crown, Package } from "lucide-react";

const TransportationDirectory = () => {
  const [transportationTypes, setTransportationTypes] = useState<any[]>([]);
  const [transportationProfiles, setTransportationProfiles] = useState<any[]>([]);
  const [selectedTransportationTypes, setSelectedTransportationTypes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transportation types and profiles from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch transportation types
        const { data: typesData, error: typesError } = await supabase
          .from('transportation_types')
          .select('*');

        if (typesError) throw typesError;

        // Fetch transportation profiles with their types
        const { data: profilesData, error: profilesError } = await supabase
          .from('transportation_profiles')
          .select(`
*,
            transportation_types(*)
          `);

        if (profilesError) throw profilesError;

        setTransportationTypes(typesData || []);
        setTransportationProfiles(profilesData || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter profiles based on selected transportation types and location
  const filteredProfiles = transportationProfiles.filter(profile => {
    const matchesType = selectedTransportationTypes.length === 0 ||
      selectedTransportationTypes.includes(profile.transp_type_id?.toString());

    const matchesLocation = !locationFilter ||
      profile.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.state?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.zip?.toString().includes(locationFilter);

    return matchesType && matchesLocation;
  });

  // Get icon for transportation type
  const getTransportationIcon = (typeName: string) => {
    const iconMap: { [key: string]: any } = {
      'bus': Bus,
      'van': Car,
      'car': Car,
      'suv': Car,
      'limo': Crown,
      'limousine': Crown,
      'truck': Truck,
      'other': Package
    };

    const lowerName = typeName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return Package;
  };

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
          {loading ? (
            <p className="text-center py-4">Loading transportation types...</p>
          ) : error ? (
            <p className="text-center py-4 text-destructive">Error loading data: {error}</p>
          ) : (
            <>
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
                <label className="text-sm font-medium">Transportation Types (select all that apply)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {transportationTypes.map((type) => {
                    const IconComponent = getTransportationIcon(type.name || '');
                    const isChecked = selectedTransportationTypes.includes(type.id?.toString());
                    return (
                      <div key={type.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={type.id?.toString()}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const typeId = type.id?.toString();
                            if (checked) {
                              setSelectedTransportationTypes([...selectedTransportationTypes, typeId]);
                            } else {
                              setSelectedTransportationTypes(selectedTransportationTypes.filter(id => id !== typeId));
                            }
                          }}
                        />
                        <label htmlFor={type.id?.toString()} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                          <IconComponent size={16} />
                          {type.name}
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
                    {selectedTransportationTypes.map(typeId => {
                      const type = transportationTypes.find(t => t.id?.toString() === typeId);
                      return (
                        <span key={typeId} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {type?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <Button
            onClick={() => {
              setSelectedTransportationTypes([]);
              setLocationFilter("");
            }}
            variant="outline"
            disabled={selectedTransportationTypes.length === 0 && !locationFilter}
          >
            Clear All Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedTransportationTypes.length > 0 ? (
              <>
                {selectedTransportationTypes.map(typeId =>
                  transportationTypes.find(t => t.id?.toString() === typeId)?.name
                ).filter(Boolean).join(', ')} ({filteredProfiles.length})
              </>
            ) : (
              <>Transportation Profiles ({filteredProfiles.length})</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading transportation profiles...</p>
          ) : error ? (
            <p className="text-center py-8 text-destructive">Error loading profiles: {error}</p>
          ) : filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No transportation profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const transportationType = profile.transportation_types?.name || 'Transportation';
                const IconComponent = getTransportationIcon(transportationType);

                return (
                  <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{profile.business_name || 'Transportation Service'}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transportationType}
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

                      <div className="space-y-2 text-sm">
                        {profile.seating_capacity && (
                          <p><strong>Capacity:</strong> {profile.seating_capacity} seats</p>
                        )}
                        {profile.price && (
                          <p><strong>Price:</strong> ${profile.price}</p>
                        )}
                        <p><strong>Location:</strong> {[profile.city, profile.state, profile.zip].filter(Boolean).join(', ') || 'Location not specified'}</p>
                      </div>

                      {profile.description && (
                        <p className="text-sm text-muted-foreground">{profile.description}</p>
                      )}

                      {profile.amenities && profile.amenities.length > 0 && (
                        <div>
                          
                          <div className="flex flex-wrap gap-1">
                            {profile.amenities.map((amenity: string, index: number) => (
                              <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button className="w-full mt-4">
                        Make Reservation
                      </Button>
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

export default TransportationDirectory;
