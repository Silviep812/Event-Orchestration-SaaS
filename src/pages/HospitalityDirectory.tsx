import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Hotel, Home, MapPin, Coffee, Phone, Mail, Globe, DollarSign, Users, ExternalLink } from "lucide-react";

const HospitalityDirectory = () => {
  const [hospitalityProfiles, setHospitalityProfiles] = useState<any[]>([]);
  const [selectedHospitalityTypes, setSelectedHospitalityTypes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHospitalityProfiles();
  }, []);

  const [hospitalityTypes, setHospitalityTypes] = useState<any[]>([]);

  const fetchHospitalityProfiles = async () => {
    try {
      // Fetch hospitality types first
      const { data: typesData, error: typesError } = await supabase
        .from('hospitality_types')
        .select('*');

      if (typesError) throw typesError;
      setHospitalityTypes(typesData || []);

      // Fetch profiles with joined hospitality type info
      const { data, error } = await supabase
        .from('hospitality_profiles')
        .select(`
          *,
          hospitality_type:hospitality_types(*)
        `);
      
      if (error) {
        console.error('Error fetching hospitality profiles:', error);
      } else {
        console.log('data from hospitality profiles:', data);
        setHospitalityProfiles(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hotel': return Hotel;
      case 'motel': return Home;
      case 'airbnb': return Home;
      case 'resort': return MapPin;
      default: return Coffee;
    }
  };

  const hospitalityTypeOptions = hospitalityTypes.map(type => ({
    value: type.id,
    label: type.name,
    icon: getIconForType(type.name)
  }));

  // Filter profiles based on selected types
  const filteredProfiles = selectedHospitalityTypes.length > 0 
    ? hospitalityProfiles.filter(profile => 
        selectedHospitalityTypes.includes(profile.hospitality_type?.id)
      )
    : hospitalityProfiles;

  const clearAllSelections = () => {
    setSelectedHospitalityTypes([]);
    setLocationFilter("");
  };


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
          
          {/* Location Filter */}
          <div className="space-y-2">
            <Label htmlFor="location">Filter by Location</Label>
            <Input
              id="location"
              placeholder="Enter city, state, or ZIP code"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>

          {(selectedHospitalityTypes.length > 0 || locationFilter) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredProfiles.length} of {hospitalityProfiles.length} suppliers
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllSelections}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Hospitality Profiles ({filteredProfiles.length} {selectedHospitalityTypes.length > 0 ? 'filtered' : 'total'} results)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const typeOption = hospitalityTypeOptions.find(opt => opt.value === profile.hospitality_type?.id);
                const IconComponent = typeOption?.icon || Hotel;
                
                return (
                  <Card key={profile.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <IconComponent size={20} />
                          {profile.business_name}
                        </CardTitle>
                        <Badge variant="secondary">{typeOption?.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-muted-foreground" />
                        <span>{profile.contact_name}</span>
                        {profile.contact_name && profile.phone_number && (
                          <span className="text-muted-foreground">•</span>
                        )}
                        <span>{profile.phone_number}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-muted-foreground" />
                        <span>{[profile.city, profile.state, profile.zip].filter(Boolean).join(', ')}</span>
                      </div>

                      {profile.cost && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign size={16} className="text-muted-foreground" />
                          <span className="font-semibold">${profile.cost.toLocaleString()}</span>
                          <span className="text-muted-foreground">per night</span>
                        </div>
                      )}

                      {profile.capacity && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users size={16} className="text-muted-foreground" />
                          <span>Capacity: {profile.capacity} guests</span>
                        </div>
                      )}

                      {profile.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe size={16} className="text-muted-foreground" />
                          <a 
                            href={`https://${profile.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {profile.website}
                          </a>
                        </div>
                      )}

                      {profile.make_reservations && (
                        <div className="pt-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="w-full"
                            onClick={() => window.open(profile.make_reservations, '_blank')}
                          >
                            <ExternalLink size={14} className="mr-2" />
                            Make Reservation
                          </Button>
                        </div>
                      )}
                      
                      {profile.hosp_amendities && profile.hosp_amendities.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Amenities:</h4>
                          <div className="flex flex-wrap gap-1">
                            {profile.hosp_amendities.map((amenity, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hospitality profiles match your selected criteria.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HospitalityDirectory;