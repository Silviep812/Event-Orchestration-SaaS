import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, Camera, Utensils, Cake, Truck, Flower, Package, Car, PersonStanding, Mail, Phone } from "lucide-react";

const ServiceVendorDirectory = () => {
  const [vendorTypes, setVendorTypes] = useState<any[]>([]);
  const [vendorProfiles, setVendorProfiles] = useState<any[]>([]);
  const [selectedVendorTypes, setSelectedVendorTypes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch vendor types and profiles from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch vendor types
        const { data: typesData, error: typesError } = await supabase
          .from('vendor_supplier_types')
          .select('*');

        if (typesError) throw typesError;

        // Fetch vendor profiles with their types
        const { data: profilesData, error: profilesError } = await supabase
          .from('serv_vendor_suppliers')
          .select(`
            *,
            vendor_supplier_types(*)
          `);

        if (profilesError) throw profilesError;

        setVendorTypes(typesData || []);
        setVendorProfiles(profilesData || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter profiles based on selected vendor types and location
  const filteredProfiles = vendorProfiles.filter(profile => {
    const matchesType = selectedVendorTypes.length === 0 || 
      selectedVendorTypes.includes(profile.vendor_sup_type_id?.toString());
    
    const matchesLocation = !locationFilter || 
      profile.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.state?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.zip?.toString().includes(locationFilter);
    
    return matchesType && matchesLocation;
  });

  // Get icon for vendor type
  const getVendorIcon = (typeName: string) => {
    const iconMap: { [key: string]: any } = {
      'caterer': Utensils,
      'chef': ChefHat,
      'bakery': Cake,
      'videographer': Camera,
      'food': Truck,
      'truck': Truck,
      'mobile': Truck,
      'ice': Utensils,
      'florist': Flower,
      'flower': Flower,
      'beverage': Utensils,
      'brewery': Utensils,
      'winery': Utensils,
      'mixologist': Utensils,
      'photo': Camera,
      'rentals': Truck,
      'delivery': Package,
      'transport': Truck,
      'security': Car,
      'volunteer': PersonStanding,
    };

    const lowerName = typeName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return Utensils;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Vendor Directory</h1>
        <p className="text-muted-foreground">
          Manage service vendors and suppliers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Vendor Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-center py-4">Loading vendor types...</p>
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
                <label className="text-sm font-medium">Vendor Types (select all that apply)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vendorTypes.map((type) => {
                    const IconComponent = getVendorIcon(type.name || '');
                    const isChecked = selectedVendorTypes.includes(type.id?.toString());
                    return (
                      <div key={type.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={type.id?.toString()}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const typeId = type.id?.toString();
                            if (checked) {
                              setSelectedVendorTypes([...selectedVendorTypes, typeId]);
                            } else {
                              setSelectedVendorTypes(selectedVendorTypes.filter(id => id !== typeId));
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
              
              {selectedVendorTypes.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Selected Vendor Types:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedVendorTypes.map(typeId => {
                      const type = vendorTypes.find(t => t.id?.toString() === typeId);
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
              setSelectedVendorTypes([]);
              setLocationFilter("");
            }} 
            variant="outline"
            disabled={selectedVendorTypes.length === 0 && !locationFilter}
          >
            Clear All Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedVendorTypes.length > 0 ? (
              <>
                {selectedVendorTypes.map(typeId =>
                  vendorTypes.find(t => t.id?.toString() === typeId)?.name
                ).filter(Boolean).join(', ')} ({filteredProfiles.length})
              </>
            ) : (
              <>Vendor Profiles ({filteredProfiles.length})</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading vendor profiles...</p>
          ) : error ? (
            <p className="text-center py-8 text-destructive">Error loading profiles: {error}</p>
          ) : filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No vendor profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const vendorType = profile.vendor_supplier_types?.name || 'Service Vendor';
                const IconComponent = getVendorIcon(vendorType);
                
                return (
                  <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{profile.business_name || 'Vendor'}</CardTitle>
                      </div>
                      {vendorType && (
                        <div className="mt-2">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {vendorType}
                          </span>
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
                      
                      {profile.specialties && profile.specialties.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Specialties:</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.specialties.map((specialty: string, index: number) => (
                              <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
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

export default ServiceVendorDirectory;