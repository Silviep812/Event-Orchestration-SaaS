import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Hotel, Home, MapPin, Coffee, Phone, Mail, Globe, DollarSign } from "lucide-react";

const HospitalityDirectory = () => {
  const [hospitalityProfiles, setHospitalityProfiles] = useState<any[]>([]);
  const [selectedHospitalityTypes, setSelectedHospitalityTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHospitalityProfiles();
  }, []);

  const fetchHospitalityProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('Hospitality Profile')
        .select('*');
      
      if (error) {
        console.error('Error fetching hospitality profiles:', error);
      } else {
        setHospitalityProfiles(data || []);
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

  // Filter profiles based on selected types
  const filteredProfiles = selectedHospitalityTypes.length > 0 
    ? hospitalityProfiles.filter(profile => 
        selectedHospitalityTypes.includes(profile.hosp_type_id)
      )
    : hospitalityProfiles;

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
          <CardTitle>
            Hospitality Profiles ({filteredProfiles.length} {selectedHospitalityTypes.length > 0 ? 'filtered' : 'total'} results)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const typeOption = hospitalityTypeOptions.find(opt => opt.value === profile.hosp_type_id);
                const IconComponent = typeOption?.icon || Hotel;
                
                return (
                  <Card key={profile.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <IconComponent size={20} />
                          {profile.hosp_biz_name}
                        </CardTitle>
                        <Badge variant="secondary">{typeOption?.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-muted-foreground" />
                        <span>{profile.hosp_contact_name}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{profile.hosp_contact_nbr}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-muted-foreground" />
                        <span>{profile.hosp_location?.join(", ")}</span>
                      </div>

                      {profile.hosp_website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe size={16} className="text-muted-foreground" />
                          <a 
                            href={`https://${profile.hosp_website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {profile.hosp_website}
                          </a>
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