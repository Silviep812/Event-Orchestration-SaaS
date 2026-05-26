import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Music, Mic, Users, MessageCircle, Presentation, Theater, HelpCircle, Mail } from "lucide-react";
import { DirectoryPageHeader } from "@/components/resource-directory/DirectoryPageHeader";
import { AddDirectoryEntryDialog } from "@/components/resource-directory/AddDirectoryEntryDialog";
import { useToast } from "@/hooks/use-toast";
import { commentsPlannerCopy } from "@/lib/nudges";
import { formatDirectoryPrice } from "@/lib/formatDirectoryPrice";
import { DirectoryProfileLink } from "@/components/resource-directory/DirectoryProfileLink";
import { directoryProfileElementId } from "@/lib/directoryProfileLinks";
import { useDirectoryProfileHighlight } from "@/hooks/useDirectoryProfileHighlight";

function entertainmentTypeRowKey(type: { id?: unknown; name?: string | null }, index: number): string {
  if (type?.id != null && String(type.id) !== "") return String(type.id);
  const slug = (type?.name || "type").replace(/\s+/g, "-").slice(0, 24);
  return `new-${index}-${slug}`;
}

function EntertainmentDirectory() {
  const [entertainmentTypes, setEntertainmentTypes] = useState<any[]>([]);
  const [entertainmentProfiles, setEntertainmentProfiles] = useState<any[]>([]);
  const [selectedEntertainmentTypes, setSelectedEntertainmentTypes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { highlightClass } = useDirectoryProfileHighlight(loading);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: typesData, error: typesError } = await supabase
        .from('entertainment_types')
        .select('*');
      if (typesError) console.error('entertainment_types:', typesError);
      setEntertainmentTypes(typesData || []);

      const { data: profilesData, error: profilesError } = await supabase
        .from('entertainments')
        .select('*, entertainment_types(*)');
      if (profilesError) {
        console.error('entertainments:', profilesError);
        toast({ title: "Entertainment profiles", description: commentsPlannerCopy.toastGeneric, variant: "destructive" });
      }
      setEntertainmentProfiles(profilesData || []);
    } catch (err: any) {
      console.error('Error fetching entertainment data:', err);
      toast({ title: "Error", description: "Failed to load entertainment directory.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      'concert': Music,
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
      <DirectoryPageHeader
        title="Entertainment Directory"
        subtitle="Select entertainment type, then browse profiles"
        action={
          <AddDirectoryEntryDialog
            title="Add Entertainment"
            table="entertainments"
            typeColumn="ent_type_id"
            customColumn="custom_type"
            typeLabel="Entertainment Type"
            typeOptions={entertainmentTypes.map((t) => ({ id: t.id, name: t.name }))}
            onCreated={fetchData}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Select Entertainment Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-center py-4">Loading entertainment types...</p>
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
                  {entertainmentTypes.map((type, idx) => {
                    const IconComponent = getEntertainmentIcon(type.name || '');
                    const typeKey = entertainmentTypeRowKey(type, idx);
                    const isChecked = selectedEntertainmentTypes.includes(typeKey);
                    const inputId = `entertainment-type-${typeKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
                    return (
                      <div key={inputId} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={inputId}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEntertainmentTypes([...selectedEntertainmentTypes, typeKey]);
                            } else {
                              setSelectedEntertainmentTypes(selectedEntertainmentTypes.filter((id) => id !== typeKey));
                            }
                          }}
                        />
                        <label htmlFor={inputId} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
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
                    {selectedEntertainmentTypes.map((typeId) => {
                      const type = entertainmentTypes.find((t, i) => entertainmentTypeRowKey(t, i) === typeId);
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
                {selectedEntertainmentTypes
                  .map((typeId) =>
                    entertainmentTypes.find((t, i) => entertainmentTypeRowKey(t, i) === typeId)?.name
                  )
                  .filter(Boolean)
                  .join(", ")}{" "}
                ({filteredProfiles.length})
              </>
            ) : (
              <>Entertainment Profiles ({filteredProfiles.length})</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading entertainment profiles...</p>
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
                  <Card
                    key={profile.id}
                    id={directoryProfileElementId(profile.id)}
                    className={`hover:shadow-lg transition-shadow ${highlightClass(profile.id)}`}
                  >
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
                        {profile.contact_name ? (
                          <p className="font-semibold">{profile.contact_name}</p>
                        ) : null}
                        {profile.email?.trim() ? (
                          <a
                            href={`mailto:${String(profile.email).trim()}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {profile.email}
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">Email not provided</p>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {profile.price ? (
                          <p>
                            <strong>Price:</strong> {formatDirectoryPrice(profile.price) ?? String(profile.price)}
                          </p>
                        ) : null}
                        <p><strong>Location:</strong> {[profile.city, profile.state, profile.zip].filter(Boolean).join(', ') || 'Location not specified'}</p>
                      </div>
                      
                      {profile.description && (
                        <p className="text-sm text-muted-foreground">{profile.description}</p>
                      )}
                      
                      <div className="flex flex-col gap-2 mt-2">
                        <DirectoryProfileLink kind="entertainment" id={profile.id} className="w-full justify-center py-1.5 border rounded-md border-border" />
                        <Button className="w-full" size="sm" onClick={() => profile.email && window.open(`mailto:${profile.email}`)} disabled={!profile.email}>
                          <Mail className="h-4 w-4 mr-2" />
                          Email
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
}

export default EntertainmentDirectory;