import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bus, Car, Truck, Crown, Package, ExternalLink } from "lucide-react";
import { DirectoryPageHeader } from "@/components/resource-directory/DirectoryPageHeader";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { normalizeExternalUrl, openReservationUrl } from "@/lib/openExternalOrMailto";

function isMissingTableOrSchemaCacheError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("schema cache") ||
    m.includes("could not find the table") ||
    m.includes("does not exist")
  );
}

const TransportationDirectory = () => {
  const [transportationTypes, setTransportationTypes] = useState<any[]>([]);
  const [transportationProfiles, setTransportationProfiles] = useState<any[]>([]);
  /** Empty = all types; otherwise match any selected `transp_type_id` (OR). */
  const [selectedTransportationTypes, setSelectedTransportationTypes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilesLoadError, setProfilesLoadError] = useState<string | null>(null);
  const [typesLoadError, setTypesLoadError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        setTypesLoadError(null);
        setProfilesLoadError(null);

        const { data: typesData, error: typesError } = await supabase
          .from("transportation_types")
          .select("*");
        if (typesError) {
          console.error("transportation_types:", typesError);
          setTypesLoadError(typesError.message);
          if (!isMissingTableOrSchemaCacheError(typesError.message)) {
            toast({
              title: "Transportation types",
              description: typesError.message,
              variant: "destructive",
            });
          }
        }
        setTransportationTypes(typesData || []);

        // Plain select avoids PostgREST embed errors; join type names client-side.
        const { data: profilesData, error: profilesError } = await supabase
          .from("transportations")
          .select("*");
        if (profilesError) {
          console.error("transportations:", profilesError);
          setProfilesLoadError(profilesError.message);
          if (!isMissingTableOrSchemaCacheError(profilesError.message)) {
            toast({
              title: "Transportation profiles",
              description:
                profilesError.message ||
                "Could not load profiles. Run migrations or check RLS in Supabase.",
              variant: "destructive",
            });
          }
        }
        setTransportationProfiles(profilesData || []);
      } catch (err: any) {
        console.error('Error fetching transportation data:', err);
        toast({ title: "Error", description: "Failed to load transportation directory.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProfiles = transportationProfiles.filter((profile) => {
    const matchesType =
      selectedTransportationTypes.length === 0 ||
      (profile.transp_type_id != null &&
        selectedTransportationTypes.includes(String(profile.transp_type_id)));

    const matchesLocation =
      !locationFilter ||
      profile.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.state?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.zip?.toString().includes(locationFilter);

    return matchesType && matchesLocation;
  });

  const transportationSelectValue =
    selectedTransportationTypes.length === 0
      ? "__all__"
      : selectedTransportationTypes.length === 1
        ? selectedTransportationTypes[0]
        : "__multi__";

  const handleTransportationSelect = (v: string) => {
    if (v === "__all__") setSelectedTransportationTypes([]);
    else if (v === "__multi__") return;
    else setSelectedTransportationTypes([v]);
  };

  const toggleTransportationType = (typeId: string, checked: boolean) => {
    setSelectedTransportationTypes((prev) => {
      if (checked) {
        if (prev.length === 0) return [typeId];
        if (prev.includes(typeId)) return prev;
        return [...prev, typeId];
      }
      return prev.filter((id) => id !== typeId);
    });
  };

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

  const setupError =
    (profilesLoadError && isMissingTableOrSchemaCacheError(profilesLoadError)) ||
    (typesLoadError && isMissingTableOrSchemaCacheError(typesLoadError));

  /** When `transportation_types` is empty but profiles have `transp_type_id`, still show type options. */
  const displayTransportationTypes = useMemo(() => {
    if (transportationTypes.length > 0) return transportationTypes;
    const raw = transportationProfiles
      .map((p) => p.transp_type_id)
      .filter((id): id is number => id != null && !Number.isNaN(Number(id)));
    const unique = [...new Set(raw.map(Number))].sort((a, b) => a - b);
    return unique.map((id) => ({
      id,
      name: `Transportation type (${id})`,
    }));
  }, [transportationTypes, transportationProfiles]);

  return (
    <div className="space-y-6">
      <DirectoryPageHeader
        title="Transportation Directory"
        subtitle="Filter by type and location, then open profile details"
      />

      {setupError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Supabase needs the directory tables</AlertTitle>
          <AlertDescription className="mt-2 space-y-2 text-pretty">
            <p>
              The linked project does not expose <code className="text-xs">public.transportations</code>{" "}
              (and possibly <code className="text-xs">transportation_types</code>) to the API yet. Apply the
              migration in Supabase: <strong>SQL Editor</strong> → paste and run{" "}
              <code className="text-xs">supabase/migrations/20260329190000_create_transportations_if_missing.sql</code>{" "}
              from this repo, then reload this page. If you use the Supabase CLI, run{" "}
              <code className="text-xs">supabase db push</code> against this project.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filter transportation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-center py-4">Loading transportation types...</p>
          ) : (
            <>
              {!setupError && displayTransportationTypes.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No transportation types loaded</AlertTitle>
                  <AlertDescription className="text-pretty">
                    <p className="text-sm">
                      Apply migrations in Supabase (including seeding{" "}
                      <code className="text-xs">transportation_types</code>, e.g.{" "}
                      <code className="text-xs">20260413120000_seed_transportation_types_by_name.sql</code> from this
                      repo), then reload. If profiles exist but types are empty, check RLS and that the table has rows.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2 max-w-md">
                <Label htmlFor="transportation-type-select">Transportation type (quick filter)</Label>
                <Select value={transportationSelectValue} onValueChange={handleTransportationSelect}>
                  <SelectTrigger id="transportation-type-select">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All types</SelectItem>
                    {selectedTransportationTypes.length > 1 && (
                      <SelectItem value="__multi__" disabled>
                        Multiple types selected — use checkboxes below to adjust
                      </SelectItem>
                    )}
                    {displayTransportationTypes.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Types (multi-select)</Label>
                <p className="text-xs text-muted-foreground">
                  Leave all unchecked for every type, or select one or more to narrow the list.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayTransportationTypes.map((type) => {
                    const IconComponent = getTransportationIcon(type.name || "");
                    const idStr = String(type.id);
                    const isChecked =
                      selectedTransportationTypes.length === 0
                        ? false
                        : selectedTransportationTypes.includes(idStr);
                    return (
                      <div
                        key={type.id}
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          id={`tt-${idStr}`}
                          checked={isChecked}
                          onCheckedChange={(c) => toggleTransportationType(idStr, c === true)}
                        />
                        <label
                          htmlFor={`tt-${idStr}`}
                          className="flex items-center gap-2 cursor-pointer text-sm font-medium"
                        >
                          <IconComponent size={16} />
                          {type.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transportation-location">Filter by location</Label>
                <Input
                  id="transportation-location"
                  placeholder="City, state, or ZIP"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </>
          )}

          <Button
            type="button"
            onClick={() => {
              setSelectedTransportationTypes([]);
              setLocationFilter("");
            }}
            variant="outline"
            disabled={selectedTransportationTypes.length === 0 && !locationFilter}
          >
            Clear filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedTransportationTypes.length > 0
              ? `${selectedTransportationTypes
                  .map(
                    (tid) =>
                      displayTransportationTypes.find((t) => String(t.id) === tid)?.name ?? tid,
                  )
                  .join(", ")} · ${filteredProfiles.length} profile(s)`
              : `Transportation profiles (${filteredProfiles.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading transportation profiles...</p>
          ) : profilesLoadError && !setupError ? (
            <p className="text-muted-foreground text-center py-8">
              Could not load profiles: {profilesLoadError}
            </p>
          ) : setupError && filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No profiles until the database migration has been applied.
            </p>
          ) : filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No transportation profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const transportationType =
                  transportationTypes.find((t) => t.id === profile.transp_type_id)?.name || "Transportation";
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

                      {profile.profile_url && String(profile.profile_url).trim() !== "" && (
                        <a
                          href={normalizeExternalUrl(String(profile.profile_url))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          Profile / website
                        </a>
                      )}

                      {profile.special_accommodations && profile.special_accommodations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Accommodations:</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.special_accommodations.map((accommodation: string, index: number) => (
                              <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                {accommodation}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(profile.booking_url?.toString().trim() ||
                        profile.profile_url?.toString().trim() ||
                        profile.email?.toString().trim()) && (
                        <Button
                          type="button"
                          className="w-full mt-4"
                          onClick={() =>
                            openReservationUrl(
                              profile.booking_url || profile.profile_url || "",
                              toast,
                              profile.email,
                            )
                          }
                        >
                          Email / reserve
                        </Button>
                      )}
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