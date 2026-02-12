import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Music, Mic, Users, MessageCircle, Presentation, Theater, HelpCircle, Mail, Phone } from "lucide-react";

const EntertainmentDirectory = () => {
  const [entertainmentTypes, setEntertainmentTypes] = useState<any[]>([]);
  const [entertainmentProfiles, setEntertainmentProfiles] = useState<any[]>([]);
  const [selectedEntertainmentTypes, setSelectedEntertainmentTypes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch entertainment types and profiles from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch entertainment types
        const { data: typesData, error: typesError } = await supabase
          .from('entertainment_types')
          .select('*');

        if (typesError) throw typesError;

        // Fetch entertainment profiles with their types
        const { data: profilesData, error: profilesError } = await supabase
          .from('entertainment_profiles')
          .select(`
            *,
            entertainment_types(*)
          `);

        if (profilesError) throw profilesError;

        setEntertainmentTypes(typesData || []);
        setEntertainmentProfiles(profilesData || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter profiles based on selected entertainment types and location
  const filteredProfiles = entertainmentProfiles.filter(profile => {
    const matchesType = selectedEntertainmentTypes.length === 0 || 
      selectedEntertainmentTypes.includes(profile.ent_type_id?.toString());
    
    const matchesLocation = !locationFilter || 
      profile.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.state?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.zip?.toString().includes(locationFilter);
    
    return matchesType && matchesLocation;
  });

  // Get icon for entertainment type
  const getEntertainmentIcon = (typeName: string) => {
    const iconMap: { [key: string]: any } = {
      'musician': Music,
      'dj': Music,
      'music': Music,
      'performer': Users,
      'standup': MessageCircle,
      'comic': MessageCircle,
      'speaker': Presentation,
      'stage': Theater,
      'production': Theater,
      'other': HelpCircle,
      'concert' : Music,
      'band': Music,
      'singer': Mic,
      'choir': Mic
    };

    const lowerName = typeName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return HelpCircle;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Entertainment Directory</h1>
        <p className="text-muted-foreground">
          Browse entertainment options for your event
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Entertainment Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-center py-4">Loading entertainment types...</p>
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
                <label className="text-sm font-medium">Entertainment Types (select all that apply)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {entertainmentTypes.map((type) => {
                    const IconComponent = getEntertainmentIcon(type.name || '');
                    const isChecked = selectedEntertainmentTypes.includes(type.id?.toString());
                    return (
                      <div key={type.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={type.id?.toString()}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const typeId = type.id?.toString();
                            if (checked) {
                              setSelectedEntertainmentTypes([...selectedEntertainmentTypes, typeId]);
                            } else {
                              setSelectedEntertainmentTypes(selectedEntertainmentTypes.filter(id => id !== typeId));
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
              
              {selectedEntertainmentTypes.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Selected Entertainment Types:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntertainmentTypes.map(typeId => {
                      const type = entertainmentTypes.find(t => t.id?.toString() === typeId);
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
              setSelectedEntertainmentTypes([]);
              setLocationFilter("");
            }} 
            variant="outline"
            disabled={selectedEntertainmentTypes.length === 0 && !locationFilter}
          >
            Clear All Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedEntertainmentTypes.length > 0 ? (
              <>
                {selectedEntertainmentTypes.map(typeId =>
                  entertainmentTypes.find(t => t.id?.toString() === typeId)?.name
                ).filter(Boolean).join(', ')} ({filteredProfiles.length})
              </>
            ) : (
              <>Entertainment Profiles ({filteredProfiles.length})</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading entertainment profiles...</p>
          ) : error ? (
            <p className="text-center py-8 text-destructive">Error loading profiles: {error}</p>
          ) : filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No entertainment profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const entertainmentType = profile.entertainment_types?.name || 'Entertainment';
                const IconComponent = getEntertainmentIcon(entertainmentType);
                
                return (
                  <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{profile.business_name || 'Entertainment Provider'}</CardTitle>
                      </div>
                      <p className="text-sm text-primary font-medium">
                        {entertainmentType}
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
                        {profile.price && (
                          <p><strong>Price:</strong> ${profile.price}</p>
                        )}
                        <p><strong>Location:</strong> {[profile.city, profile.state, profile.zip].filter(Boolean).join(', ') || 'Location not specified'}</p>
                      </div>
                      
                      {profile.description && (
                        <p className="text-sm text-muted-foreground">{profile.description}</p>
                      )}
                      
                      <div className="flex gap-2 mt-2">
                        <Button className="flex-1" size="sm" onClick={() => profile.email && window.open(`mailto:${profile.email}`)} disabled={!profile.email}>
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button className="flex-1" size="sm" onClick={() => profile.phone_number && window.open(`tel:${profile.phone_number}`)} disabled={!profile.phone_number}>
                          <Phone className="h-4 w-4" />
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

export default EntertainmentDirectory;