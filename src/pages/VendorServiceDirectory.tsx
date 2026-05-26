import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Camera, Lightbulb, Music, Gamepad2, Flower, Home, Table, Mail } from "lucide-react";
import { DirectoryPageHeader } from "@/components/resource-directory/DirectoryPageHeader";
import { AddDirectoryEntryDialog } from "@/components/resource-directory/AddDirectoryEntryDialog";
import { useToast } from "@/hooks/use-toast";
import { commentsPlannerCopy } from "@/lib/nudges";
import { formatDirectoryPrice } from "@/lib/formatDirectoryPrice";
import { DirectoryProfileLink } from "@/components/resource-directory/DirectoryProfileLink";
import { directoryProfileElementId } from "@/lib/directoryProfileLinks";
import { useDirectoryProfileHighlight } from "@/hooks/useDirectoryProfileHighlight";

const VendorServiceDirectory = () => {
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [serviceProfiles, setServiceProfiles] = useState<any[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const rentalIdParam = useSearchParams()[0].get("rentalId");
  const [rentalPreview, setRentalPreview] = useState<Record<string, unknown> | null>(null);
  const { highlightClass, rentalHighlightClass } = useDirectoryProfileHighlight(loading);

  useEffect(() => {
    if (!rentalIdParam) {
      setRentalPreview(null);
      return;
    }
    let cancelled = false;
    void supabase
      .from("service_rental_buy")
      .select("*")
      .eq("id", rentalIdParam)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setRentalPreview(data ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [rentalIdParam]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: typesData, error: typesError } = await supabase
        .from('vendor_supplier_types')
        .select('*');
      if (typesError) console.error('vendor_supplier_types:', typesError);
      setServiceTypes(typesData || []);

      const { data: profilesData, error: profilesError } = await supabase
        .from('vendor')
        .select(`
          *,
          vendor_supplier_types ( id, name )
        `);
      if (profilesError) {
        console.error('vendor:', profilesError);
        toast({ title: "Vendor profiles", description: commentsPlannerCopy.toastGeneric, variant: "destructive" });
      }
      setServiceProfiles(profilesData || []);
    } catch (err: any) {
      console.error('Error fetching vendor service data:', err);
      toast({ title: "Error", description: "Failed to load vendor service directory.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** When `vendor_supplier_types` has no rows, derive labels from the join on each profile (or numeric fallback). */
  const displayServiceTypes = useMemo(() => {
    if (serviceTypes.length > 0) return serviceTypes;
    const map = new Map<number, string>();
    for (const p of serviceProfiles) {
      const id = p.vendor_sup_type_id;
      if (id == null || Number.isNaN(Number(id))) continue;
      const nid = Number(id);
      const rel = p.vendor_supplier_types as { name?: string } | null | undefined;
      const label = rel?.name?.trim() || `Service type (${nid})`;
      if (!map.has(nid)) map.set(nid, label);
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([id, name]) => ({ id, name }));
  }, [serviceTypes, serviceProfiles]);

  // Filter profiles based on selected service types and location
  const filteredProfiles = serviceProfiles.filter(profile => {
    const matchesType =
      selectedServiceTypes.length === 0 ||
      (profile.vendor_sup_type_id != null &&
        selectedServiceTypes.includes(String(profile.vendor_sup_type_id)));

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
      <DirectoryPageHeader
        title="Vendor Service Rental/Buy Directory"
        subtitle="Select rental/service type, then vendor profile"
        action={
          <AddDirectoryEntryDialog
            title="Add Vendor (Rental / Buy)"
            table="vendor"
            typeColumn="vendor_sup_type_id"
            customColumn="custom_type"
            typeLabel="Service / Rental Type"
            typeOptions={serviceTypes.map((t) => ({ id: t.id, name: t.name }))}
            onCreated={fetchData}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Select Service Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-center py-4">Loading service types...</p>
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
                  {displayServiceTypes.map((type) => {
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
                      const type = displayServiceTypes.find(t => t.id?.toString() === typeId);
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

      {rentalPreview && rentalIdParam && typeof rentalPreview.id === "string" ? (
        <Card
          id={`directory-rental-${rentalIdParam}`}
          className={`border-primary/40 bg-muted/30 ${rentalHighlightClass(rentalPreview.id as string)}`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Linked equipment / rental partner</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              Opened from a shared profile link (<code className="text-xs">service_rental_buy</code>).
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">{String(rentalPreview.business_name ?? "Rental partner")}</p>
            <p className="text-muted-foreground">
              {[rentalPreview.city, rentalPreview.state, rentalPreview.zip].filter(Boolean).join(", ") || "—"}
            </p>
            {typeof rentalPreview.email === "string" && rentalPreview.email.trim() ? (
              <a className="text-primary hover:underline" href={`mailto:${rentalPreview.email.trim()}`}>
                {rentalPreview.email}
              </a>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedServiceTypes.length > 0 ? (
              <>
                {selectedServiceTypes.map(typeId =>
                  displayServiceTypes.find(t => t.id?.toString() === typeId)?.name
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
          ) : filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No service profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const typeName =
                  displayServiceTypes.find((t) => t.id === profile.vendor_sup_type_id)?.name || "Service";
                const IconComponent = getServiceIcon(typeName);
                
                return (
                  <Card
                    key={profile.id}
                    id={directoryProfileElementId(profile.id)}
                    className={`hover:shadow-lg transition-shadow ${highlightClass(profile.id)}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{profile.business_name || 'Service Provider'}</CardTitle>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {typeName}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Contact Person</p>
                        <p className="font-semibold">{profile.contact_name || 'N/A'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        {profile.email?.trim() ? (
                          <a
                            href={`mailto:${String(profile.email).trim()}`}
                            className="text-sm text-primary hover:underline break-all"
                          >
                            {profile.email}
                          </a>
                        ) : (
                          <p className="text-sm">N/A</p>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="text-sm">{[profile.city, profile.state, profile.zip].filter(Boolean).join(', ') || 'Location not specified'}</p>
                      </div>
                      
                      {profile.price && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Starting Cost</p>
                          <p className="text-lg font-bold text-primary">
                            {formatDirectoryPrice(profile.price) ?? String(profile.price)}
                          </p>
                        </div>
                      )}
                      
                      {profile.description && (
                        <p className="text-sm text-muted-foreground">{profile.description}</p>
                      )}
                      
                      <div className="flex flex-col gap-2 mt-4">
                        <DirectoryProfileLink kind="vendor" id={profile.id} className="w-full justify-center py-2 border rounded-md border-border" />
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => window.location.href = `mailto:${profile.email || ''}`}
                          disabled={!profile.email}
                        >
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
};

export default VendorServiceDirectory;