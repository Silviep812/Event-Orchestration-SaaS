import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Hotel, Home, MapPin, Coffee, Phone, Mail, Globe, DollarSign, Users, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HospitalityDirectory = () => {
  const [hospitalityProfiles, setHospitalityProfiles] = useState<any[]>([]);
  const [selectedHospitalityTypes, setSelectedHospitalityTypes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showOtherForm, setShowOtherForm] = useState(false);
  const [otherFormData, setOtherFormData] = useState({
    business_name: "",
    address: "",
    email: "",
    phone: ""
  });
  const { toast } = useToast();

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

      // Fetch profiles from the correct table
      const { data, error } = await supabase
        .from('hospitality_profiles')
        .select('*');
      
      if (error) {
        console.error('Error fetching hospitality profiles:', error);
      } else {
        console.log('data from Hospitality Profile:', data);
        
        // Remove duplicates based on business name
        const uniqueProfiles = data?.filter((profile, index, self) =>
          index === self.findIndex((p) => (
            p.business_name === profile.business_name &&
            p.hospitality_type === profile.hospitality_type
          ))
        ) || [];
        
        setHospitalityProfiles(uniqueProfiles);
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
      case 'airbnb': return Home;
      case 'resort': return MapPin;
      case 'other': return Coffee;
      default: return Hotel;
    }
  };

  const getBadgeColorForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hotel': return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case 'resort': return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case 'airbnb': return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case 'other': return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const hospitalityTypeOptions = hospitalityTypes.map(type => ({
    value: type.id.toString(),
    label: type.name.charAt(0).toUpperCase() + type.name.slice(1),
    icon: getIconForType(type.name)
  }));

  // Filter profiles based on selected types
  const filteredProfiles = selectedHospitalityTypes.length > 0 
    ? hospitalityProfiles.filter(profile => 
        selectedHospitalityTypes.includes(profile.hospitality_type?.toString())
      )
    : hospitalityProfiles;

  const clearAllSelections = () => {
    setSelectedHospitalityTypes([]);
    setLocationFilter("");
    setShowOtherForm(false);
  };

  const handleOtherTypeChange = (checked: boolean, typeId: string) => {
    if (checked) {
      setSelectedHospitalityTypes([...selectedHospitalityTypes, typeId]);
      // Find if this is the "Other" type
      const otherType = hospitalityTypes.find(type => type.name.toLowerCase() === "other");
      if (otherType && typeId === otherType.id.toString()) {
        setShowOtherForm(true);
      }
    } else {
      setSelectedHospitalityTypes(selectedHospitalityTypes.filter(type => type !== typeId));
      const otherType = hospitalityTypes.find(type => type.name.toLowerCase() === "other");
      if (otherType && typeId === otherType.id.toString()) {
        setShowOtherForm(false);
        setOtherFormData({ business_name: "", address: "", email: "", phone: "" });
      }
    }
  };

  const handleOtherFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const otherType = hospitalityTypes.find(type => type.name.toLowerCase() === "other");
      if (!otherType) {
        toast({
          title: "Error",
          description: "Other hospitality type not found",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('hospitality_profiles')
        .insert([
          {
            business_name: otherFormData.business_name,
            city: otherFormData.address,
            contact_name: otherFormData.business_name,
            phone_number: otherFormData.phone,
            email: otherFormData.email,
            hospitality_type: otherType.id
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hospitality provider added successfully"
      });

      setOtherFormData({ business_name: "", address: "", email: "", phone: "" });
      fetchHospitalityProfiles();
    } catch (error) {
      console.error('Error adding hospitality provider:', error);
      toast({
        title: "Error",
        description: "Failed to add hospitality provider",
        variant: "destructive"
      });
    }
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
            <label className="text-sm font-medium">Hospitality Types</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hospitalityTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isChecked = selectedHospitalityTypes.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleOtherTypeChange(!!checked, option.value)}
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
          
          {/* Other Type Form */}
          {showOtherForm && (
            <form onSubmit={handleOtherFormSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="text-sm font-semibold">Add Custom Hospitality Provider</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    required
                    value={otherFormData.business_name}
                    onChange={(e) => setOtherFormData({...otherFormData, business_name: e.target.value})}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    required
                    value={otherFormData.address}
                    onChange={(e) => setOtherFormData({...otherFormData, address: e.target.value})}
                    placeholder="Enter address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={otherFormData.email}
                    onChange={(e) => setOtherFormData({...otherFormData, email: e.target.value})}
                    placeholder="Enter email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={otherFormData.phone}
                    onChange={(e) => setOtherFormData({...otherFormData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full md:w-auto">
                Add Provider
              </Button>
            </form>
          )}
          
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
            {(() => {
              console.log('Selected types:', selectedHospitalityTypes);
              console.log('Hospitality types:', hospitalityTypes);
              
              if (selectedHospitalityTypes.length > 0) {
                const typeNames = selectedHospitalityTypes.map((typeId, index) => {
                  const matchedType = hospitalityTypes.find(t => t.id.toString() === typeId);
                  console.log('Looking for typeId:', typeId, 'Found:', matchedType);
                  const typeName = matchedType?.name || 'Unknown';
                  const displayName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
                  return displayName;
                }).join(', ');
                
                return `${typeNames} Profiles (${filteredProfiles.length} filtered results)`;
              }
              
              return `Hospitality Profiles (${filteredProfiles.length} total results)`;
            })()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const typeOption = hospitalityTypeOptions.find(opt => opt.value === profile.hospitality_type?.toString());
                const matchedType = hospitalityTypes.find(t => t.id === profile.hospitality_type);
                const typeName = typeOption?.label || matchedType?.name || 'Other';
                const displayTypeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
                const IconComponent = typeOption?.icon || Hotel;
                
                return (
                  <Card key={profile.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <IconComponent size={20} />
                          {profile.business_name}
                        </CardTitle>
                        <Badge className={getBadgeColorForType(displayTypeName)}>{displayTypeName}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {profile.contact_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={16} className="text-muted-foreground" />
                          <span>{profile.contact_name}</span>
                          {profile.phone_number && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span>{profile.phone_number}</span>
                            </>
                          )}
                        </div>
                      )}
                      
                      {(profile.city || profile.state || profile.zip) && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={16} className="text-muted-foreground" />
                          <span>{[profile.city, profile.state, profile.zip].filter(Boolean).join(', ')}</span>
                        </div>
                      )}

                      {profile.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={16} className="text-muted-foreground" />
                          <span className="text-sm">{profile.email}</span>
                        </div>
                      )}

                      {profile.cost && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign size={16} className="text-muted-foreground" />
                          <span className="font-semibold">${profile.cost.toLocaleString()}</span>
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
                            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
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