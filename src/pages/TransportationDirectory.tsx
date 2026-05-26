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
import { Bus, Car, Truck, Crown, Package, ExternalLink, RefreshCw } from "lucide-react";
import { DirectoryPageHeader } from "@/components/resource-directory/DirectoryPageHeader";
import { AddDirectoryEntryDialog } from "@/components/resource-directory/AddDirectoryEntryDialog";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { normalizeExternalUrl, openReservationUrl } from "@/lib/openExternalOrMailto";
import { commentsPlannerCopy, workflowPlannerCopy } from "@/lib/nudges";
import { formatDirectoryPrice } from "@/lib/formatDirectoryPrice";
import { DirectoryProfileLink } from "@/components/resource-directory/DirectoryProfileLink";
import { directoryProfileElementId } from "@/lib/directoryProfileLinks";
import { useDirectoryProfileHighlight } from "@/hooks/useDirectoryProfileHighlight";

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
  const [usedServiceVendorFallback, setUsedServiceVendorFallback] = useState(false);
  /** Empty = all types; otherwise match any selected `transp_type_id` (OR). */
  const [selectedTransportationTypes, setSelectedTransportationTypes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilesLoadError, setProfilesLoadError] = useState<string | null>(null);
  const [typesLoadError, setTypesLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { highlightClass } = useDirectoryProfileHighlight(loading);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setUsedServiceVendorFallback(false);

        setTypesLoadError(null);
        setProfilesLoadError(null);

        // Ensure persisted session is applied before REST calls (avoids first-load race with RLS).
        await supabase.auth.getSession();

        const { data: typesData, error: typesError } = await supabase
          .from("transportation_types")
          .select("*");
        if (typesError) {
          console.error("transportation_types:", typesError);
          if (!cancelled) setTypesLoadError(typesError.message);
          if (!isMissingTableOrSchemaCacheError(typesError.message)) {
            toast({
              title: "Transportation types",
              description: commentsPlannerCopy.toastGeneric,
              variant: "destructive",
            });
          }
        }
        if (!cancelled) setTransportationTypes(typesData || []);

        // Plain select avoids embed errors; join type names client-side.
        const { data: profilesData, error: profilesError } = await supabase
          .from("transportations")
          .select("*");
        if (profilesError) {
          console.error("transportations:", profilesError);
          if (!cancelled) setProfilesLoadError(profilesError.message);
          if (!isMissingTableOrSchemaCacheError(profilesError.message)) {
            toast({
              title: "Transportation profiles",
              description: commentsPlannerCopy.toastGeneric,
              variant: "destructive",
            });
          }
        }
        const directProfiles = profilesData || [];
        if (!cancelled) setTransportationProfiles(directProfiles);

        // Fallback: if dedicated transportation tables are empty/unavailable, reuse service vendor profiles
        // with transportation-like supplier types so the directory is not blank.
        if (!cancelled && directProfiles.length === 0) {
          const { data: fallbackProfilesData, error: fallbackProfilesError } = await supabase
            .from("vendor")
            .select("*, vendor_supplier_types(id, name)");
          if (fallbackProfilesError) {
            console.error("vendor fallback:", fallbackProfilesError);
          } else {
            const fallbackProfiles = (fallbackProfilesData || []).filter((row: any) => {
              const typeName = String(row.vendor_supplier_types?.name || "").toLowerCase();
              return /(transport|bus|shuttle|limo|logistics|car|van|coach)/i.test(typeName);
            });
            if (!cancelled && fallbackProfiles.length > 0) {
              const fallbackTypeMap = new Map<string, { id: string; name: string }>();
              fallbackProfiles.forEach((row: any) => {
                const t = row.vendor_supplier_types;
                if (!t?.id) return;
                const key = `fallback-${t.id}`;
                if (!fallbackTypeMap.has(key)) {
                  const label = String(t.name ?? "").trim();
                  fallbackTypeMap.set(key, {
                    id: key,
                    name: label || "Transport & logistics",
                  });
                }
              });
              const mapped = fallbackProfiles.map((row: any) => ({
                ...row,
                transp_type_id: row.vendor_supplier_types?.id
                  ? `fallback-${row.vendor_supplier_types.id}`
                  : null,
                profile_url: row.profile_url,
                booking_url: row.booking_url,
              }));
              if (!cancelled) {
                // Never replace canonical `transportation_types` (Bus, Van, Limo, …) with only vendor
                // supplier labels — that produced a single "Transportation" checkbox when `transportations` was empty.
                const fallbackTypesList = Array.from(fallbackTypeMap.values());
                setTransportationTypes((prev) => {
                  const byId = new Map<string, { id: string | number; name: string }>();
                  for (const t of prev) {
                    byId.set(String(t.id), { id: t.id, name: String(t.name ?? "").trim() || `Type (${t.id})` });
                  }
                  for (const ft of fallbackTypesList) {
                    if (!byId.has(String(ft.id))) byId.set(String(ft.id), ft);
                  }
                  return Array.from(byId.values());
                });
                setTransportationProfiles(mapped);
                setUsedServiceVendorFallback(true);
                setTypesLoadError(null);
                setProfilesLoadError(null);
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching transportation data:', err);
        toast({ title: "Error", description: "Failed to load transportation directory.", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredProfiles = transportationProfiles.filter((profile) => {
    const pid = profile.transp_type_id;
    const matchesType =
      selectedTransportationTypes.length === 0 ||
      (pid != null &&
        pid !== "" &&
        selectedTransportationTypes.some((sel) => String(sel) === String(pid)));

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
    !usedServiceVendorFallback &&
    ((profilesLoadError && isMissingTableOrSchemaCacheError(profilesLoadError)) ||
      (typesLoadError && isMissingTableOrSchemaCacheError(typesLoadError)));

  /**
   * Type filters: all rows from `transportation_types`, plus any `transp_type_id` on profiles that
   * is missing from that list (stale IDs after reseed, string vs number, or fallback-* ids) so
   * categories stay selectable and profiles are not hidden until data is fixed.
   */
  const displayTransportationTypes = useMemo(() => {
    const byId = new Map<string, { id: string | number; name: string }>();

    for (const t of transportationTypes) {
      const sid = String(t.id);
      byId.set(sid, {
        id: t.id,
        name: String(t.name ?? "").trim() || `Type (${sid})`,
      });
    }

    for (const p of transportationProfiles) {
      const tid = p.transp_type_id;
      if (tid === null || tid === undefined || tid === "") continue;
      const sid = String(tid);
      if (byId.has(sid)) continue;
      const name =
        sid.startsWith("fallback-")
          ? "Transport & logistics"
          : `Transportation type (${tid})`;
      byId.set(sid, {
        id: /^\d+$/.test(sid) ? Number(sid) : tid,
        name,
      });
    }

    return Array.from(byId.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }),
    );
  }, [transportationTypes, transportationProfiles]);

  return (
    <div className="space-y-6">
      <DirectoryPageHeader
        title="Transportation Directory"
        subtitle="Filter by type and location, then open profile details"
        action={
          <AddDirectoryEntryDialog
            title="Add Transportation"
            table="transportations"
            typeColumn="transp_type_id"
            customColumn="custom_type"
            typeLabel="Transportation Type"
            showCapacity
            typeOptions={transportationTypes
              .filter((t) => typeof t.id === "number")
              .map((t) => ({ id: t.id, name: t.name }))}
            onCreated={() => setRefreshKey((k) => k + 1)}
          />
        }
      />

      {setupError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{workflowPlannerCopy.transportationSetupTitle}</AlertTitle>
          <AlertDescription className="mt-2 text-pretty">
            <p>{workflowPlannerCopy.transportationSetupBody}</p>
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
                  <AlertTitle>{workflowPlannerCopy.transportationNoTypesTitle}</AlertTitle>
                  <AlertDescription className="text-pretty">
                    <p className="text-sm">{workflowPlannerCopy.transportationNoTypesBody}</p>
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
                <Label className="text-sm font-medium">Vehicle / service categories</Label>
                <p className="text-xs text-muted-foreground">
                  Each row is a category (for example Bus, Van, Limousine), not the whole Transportation section.
                  Leave all unchecked to show every category, or pick one or more to narrow the list.
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

          <div className="flex flex-wrap gap-2">
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
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              disabled={loading}
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
              Reload profiles
            </Button>
          </div>
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
            <div className="text-center py-8 space-y-2">
              <p className="text-muted-foreground">{workflowPlannerCopy.transportationProfilesLoadFailed}</p>
              <p className="text-xs text-muted-foreground font-mono break-words max-w-prose mx-auto">
                {profilesLoadError}
              </p>
            </div>
          ) : setupError && filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {workflowPlannerCopy.transportationProfilesPendingBody}
            </p>
          ) : filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No transportation profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const transportationType =
                  displayTransportationTypes.find((t) => String(t.id) === String(profile.transp_type_id))?.name ||
                  "Transportation";
                const IconComponent = getTransportationIcon(transportationType);
                
                return (
                  <Card
                    key={profile.id}
                    id={directoryProfileElementId(profile.id)}
                    className={`hover:shadow-lg transition-shadow ${highlightClass(profile.id)}`}
                  >
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
                          <p>
                            <strong>Price:</strong> {formatDirectoryPrice(profile.price) ?? String(profile.price)}
                          </p>
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

                      <DirectoryProfileLink kind="transportation" id={profile.id} className="w-full justify-center py-1.5 border rounded-md border-border" />

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