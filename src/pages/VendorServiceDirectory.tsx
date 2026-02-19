import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Camera, Lightbulb, Music, Gamepad2, Flower, Home, Table, Mail, Phone } from "lucide-react";

const VendorServiceDirectory = () => {
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [serviceProfiles, setServiceProfiles] = useState<any[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch service types and profiles from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch service types
        const { data: typesData, error: typesError } = await supabase
          .from('vendor_rental_types')
          .select('*');

        if (typesError) throw typesError;

        // Fetch service profiles with their assignments and types
        const { data: profilesData, error: profilesError } = await supabase
          .from('serv_vendor_rentals')
          .select(`
            *,
            serv_vendor_rental_assignments(
              vendor_rental_types(*)
            )
          `);

        if (profilesError) throw profilesError;

        setServiceTypes(typesData || []);
        setServiceProfiles(profilesData || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter profiles based on selected service types and location
  const filteredProfiles = serviceProfiles.filter(profile => {
    const matchesType = selectedServiceTypes.length === 0 || 
      (profile.serv_vendor_rental_assignments && profile.serv_vendor_rental_assignments.length > 0 &&
        profile.serv_vendor_rental_assignments.some((assignment: any) => 
          selectedServiceTypes.includes(assignment.vendor_rental_types?.id?.toString())
        ));
    
    const matchesLocation = !locationFilter || 
      profile.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.state?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.zip?.toString().includes(locationFilter);
    
    return matchesType && matchesLocation;
  });

  // Get icon for service type
  const getServiceIcon = (typeName: string) => {
    const iconMap: { [key: string]: any } = {
      'transport': Truck,
      'photo': Camera,
      'lighting': Lightbulb,
      'audio': Music,
      'game': Gamepad2,
      'flower': Flower,
      'tent': Home,
      'table': Table,
      'chair': Table,
      'housewares': Home,
      'entertainment': Music,
      'toilet': Home,
      'prop': Camera,
      'decor': Flower,
      'child': Gamepad2
    };

    const lowerName = typeName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return Home;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendor Service</h1>
        <p className="text-muted-foreground">
          Browse vendor services and rental options
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Service Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-center py-4">Loading service types...</p>
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
                <label className="text-sm font-medium">Service Types (select all that apply)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {serviceTypes.map((type) => {
                    const IconComponent = getServiceIcon(type.name || '');
                    const isChecked = selectedServiceTypes.includes(type.id?.toString());
                    return (
                      <div key={type.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={type.id?.toString()}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const typeId = type.id?.toString();
                            if (checked) {
                              setSelectedServiceTypes([...selectedServiceTypes, typeId]);
                            } else {
                              setSelectedServiceTypes(selectedServiceTypes.filter(id => id !== typeId));
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
              
              {selectedServiceTypes.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Selected Service Types:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedServiceTypes.map(typeId => {
                      const type = serviceTypes.find(t => t.id?.toString() === typeId);
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
              setSelectedServiceTypes([]);
              setLocationFilter("");
            }} 
            variant="outline"
            disabled={selectedServiceTypes.length === 0 && !locationFilter}
          >
            Clear All Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedServiceTypes.length > 0 ? (
              <>
                {selectedServiceTypes.map(typeId =>
                  serviceTypes.find(t => t.id?.toString() === typeId)?.name
                ).filter(Boolean).join(', ')} ({filteredProfiles.length})
              </>
            ) : (
              <>Service Profiles ({filteredProfiles.length})</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading service profiles...</p>
          ) : error ? (
            <p className="text-center py-8 text-destructive">Error loading profiles: {error}</p>
          ) : filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No service profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const profileTypes = profile.serv_vendor_rental_assignments?.map((assignment: any) => 
                  assignment.vendor_rental_types?.name
                ).filter(Boolean) || [];
                const primaryType = profileTypes[0] || 'Service';
                const IconComponent = getServiceIcon(primaryType);
                
                return (
                  <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{profile.business_name || 'Service Provider'}</CardTitle>
                      </div>
                      {profileTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {profileTypes.map((type: string, index: number) => (
                            <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {type}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Contact Person</p>
                        <p className="font-semibold">{profile.contact_name || 'N/A'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-sm">{profile.email || 'N/A'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="text-sm">{profile.phone_number || 'N/A'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="text-sm">{[profile.city, profile.state, profile.zip].filter(Boolean).join(', ') || 'Location not specified'}</p>
                      </div>
                      
                      {profile.price && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Starting Cost</p>
                          <p className="text-lg font-bold text-primary">${profile.price}</p>
                        </div>
                      )}
                      
                      {profile.description && (
                        <p className="text-sm text-muted-foreground">{profile.description}</p>
                      )}
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          className="flex-1" 
                          variant="outline"
                          onClick={() => window.location.href = `mailto:${profile.email || ''}`}
                          disabled={!profile.email}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                        <Button 
                          className="flex-1" 
                          variant="outline"
                          onClick={() => window.location.href = `tel:${profile.phone_number || ''}`}
                          disabled={!profile.phone_number}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Phone
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
    </div>
  );
};

export default VendorServiceDirectory;