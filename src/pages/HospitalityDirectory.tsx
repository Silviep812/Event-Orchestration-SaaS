import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Hotel, Home, MapPin, Coffee, Phone, Mail, Globe, DollarSign } from "lucide-react";

const HospitalityDirectory = () => {
  const [hospitalityTypes, setHospitalityTypes] = useState<any[]>([]);
  const [selectedHospitalityTypes, setSelectedHospitalityTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHospitalityTypes();
  }, []);

  const fetchHospitalityTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('Hospitality Directory')
        .select('*');
      
      if (error) {
        console.error('Error fetching hospitality types:', error);
      } else {
        setHospitalityTypes(data || []);
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

  // Mock data for hospitality profiles
  const mockHospitalityProfiles = [
    {
      id: "1",
      hosp_biz_name: "Grand Plaza Hotel",
      hosp_contact_name: "John Smith",
      hosp_contact_nbr: "555-0123",
      hosp_location: ["Downtown", "New York", "NY"],
      hosp_website: "www.grandplaza.com",
      hosp_type_id: "hotel"
    },
    {
      id: "2",
      hosp_biz_name: "Ocean View Resort",
      hosp_contact_name: "Sarah Johnson",
      hosp_contact_nbr: "555-0456",
      hosp_location: ["Beachfront", "Miami", "FL"],
      hosp_website: "www.oceanviewresort.com",
      hosp_type_id: "resort"
    },
    {
      id: "3",
      hosp_biz_name: "Cozy Mountain Cabin",
      hosp_contact_name: "Mike Wilson",
      hosp_contact_nbr: "555-0789",
      hosp_location: ["Mountain View", "Aspen", "CO"],
      hosp_website: "www.airbnb.com/mountain-cabin",
      hosp_type_id: "airbnb"
    },
    {
      id: "4",
      hosp_biz_name: "Budget Inn & Suites",
      hosp_contact_name: "Lisa Brown",
      hosp_contact_nbr: "555-0321",
      hosp_location: ["Highway 101", "Phoenix", "AZ"],
      hosp_website: "www.budgetinn.com",
      hosp_type_id: "motel"
    },
    {
      id: "5",
      hosp_biz_name: "Luxury Downtown Loft",
      hosp_contact_name: "David Chen",
      hosp_contact_nbr: "555-0654",
      hosp_location: ["Financial District", "San Francisco", "CA"],
      hosp_website: "www.airbnb.com/luxury-loft",
      hosp_type_id: "airbnb"
    },
    {
      id: "6",
      hosp_biz_name: "The Riverside Inn",
      hosp_contact_name: "Emily Davis",
      hosp_contact_nbr: "555-0987",
      hosp_location: ["River District", "Portland", "OR"],
      hosp_website: "www.riversideinn.com",
      hosp_type_id: "hotel"
    }
  ];

  // Filter profiles based on selected types
  const filteredProfiles = selectedHospitalityTypes.length > 0 
    ? mockHospitalityProfiles.filter(profile => 
        selectedHospitalityTypes.includes(profile.hosp_type_id)
      )
    : mockHospitalityProfiles;

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
                        <span>{profile.hosp_location.join(", ")}</span>
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