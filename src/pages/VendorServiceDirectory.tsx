import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState, useMemo } from "react";
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

/**
 * Equipment / Vendor Service Rental-Buy directory.
 * Profiles come from `service_rental_buy`; types from `vendor_rental_types`
 * via `service_rental_buy_assignments` (not the personnel `vendor` table).
 */
const VendorServiceDirectory = () => {
  const [rentalTypes, setRentalTypes] = useState<{ id: number; name: string }[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<
    { service_rental_buy_id: string | null; vendor_rental_type_id: number | null }[]
  >([]);
  const [selectedRentalTypes, setSelectedRentalTypes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { rentalHighlightClass } = useDirectoryProfileHighlight(loading);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [typesRes, rentalsRes, assignRes] = await Promise.all([
        supabase.from("vendor_rental_types").select("id, name").order("name"),
        supabase.from("service_rental_buy").select("*").order("business_name"),
        supabase.from("service_rental_buy_assignments").select("service_rental_buy_id, vendor_rental_type_id"),
      ]);
      if (typesRes.error) console.error("vendor_rental_types:", typesRes.error);
      if (rentalsRes.error) {
        console.error("service_rental_buy:", rentalsRes.error);
        toast({ title: "Rental profiles", description: commentsPlannerCopy.toastGeneric, variant: "destructive" });
      }
      if (assignRes.error) console.error("service_rental_buy_assignments:", assignRes.error);
      setRentalTypes(typesRes.data || []);
      setRentals(rentalsRes.data || []);
      setAssignments(assignRes.data || []);
    } catch (err) {
      console.error("Error fetching rental directory:", err);
      toast({ title: "Error", description: "Failed to load vendor service rental directory.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const typeIdsForRental = useCallback(
    (rentalId: string) =>
      assignments
        .filter((a) => a.service_rental_buy_id === rentalId)
        .map((a) => a.vendor_rental_type_id)
        .filter((id): id is number => id != null),
    [assignments],
  );

  const displayTypes = useMemo(() => {
    if (rentalTypes.length > 0) return rentalTypes;
    const map = new Map<number, string>();
    for (const a of assignments) {
      if (a.vendor_rental_type_id == null) continue;
      if (!map.has(a.vendor_rental_type_id)) {
        map.set(a.vendor_rental_type_id, `Rental type (${a.vendor_rental_type_id})`);
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [rentalTypes, assignments]);

  const filteredProfiles = rentals.filter((profile) => {
    const typeIds = typeIdsForRental(profile.id).map(String);
    const matchesType =
      selectedRentalTypes.length === 0 || selectedRentalTypes.some((t) => typeIds.includes(t));
    const matchesLocation =
      !locationFilter ||
      profile.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.state?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.zip?.toString().includes(locationFilter);
    return matchesType && matchesLocation;
  });

  const getServiceIcon = (typeName: string) => {
    const iconMap: { [key: string]: typeof Home } = {
      transport: Truck,
      photo: Camera,
      lighting: Lightbulb,
      audio: Music,
      game: Gamepad2,
      flower: Flower,
      tent: Home,
      table: Table,
      chair: Table,
      housewares: Home,
      entertainment: Music,
      toilet: Home,
      prop: Camera,
      decor: Flower,
      child: Gamepad2,
    };
    const lowerName = typeName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) return icon;
    }
    return Home;
  };

  return (
    <div className="space-y-6">
      <DirectoryPageHeader
        title="Vendor Service Rental/Buy Directory"
        subtitle="Select rental type, then equipment / rental partner profile"
        action={
          <AddDirectoryEntryDialog
            title="Add Rental / Buy Partner"
            table="service_rental_buy"
            typeColumn="unused"
            customColumn="description"
            typeLabel="Rental Type"
            typeOptions={displayTypes.map((t) => ({ id: t.id, name: t.name }))}
            skipTypeFk
            onInserted={async (rowId, selectedTypeId) => {
              if (!rowId || !selectedTypeId) return;
              const typeNum = Number(selectedTypeId);
              if (Number.isNaN(typeNum)) return;
              const { error } = await supabase.from("service_rental_buy_assignments").insert({
                service_rental_buy_id: rowId,
                vendor_rental_type_id: typeNum,
              });
              if (error) console.error("service_rental_buy_assignments insert:", error);
            }}
            onCreated={fetchData}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Select Rental Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-center py-4">Loading rental types...</p>
          ) : (
            <>
              <div className="space-y-3">
                <label className="text-sm font-medium" htmlFor="rental-location-filter">
                  Filter by Location
                </label>
                <Input
                  id="rental-location-filter"
                  placeholder="Enter city, state, or zip code"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Rental Types (select all that apply)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayTypes.map((type) => {
                    const IconComponent = getServiceIcon(type.name || "");
                    const typeId = type.id?.toString();
                    const isChecked = selectedRentalTypes.includes(typeId);
                    return (
                      <div key={type.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={`rental-type-${typeId}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedRentalTypes([...selectedRentalTypes, typeId]);
                            else setSelectedRentalTypes(selectedRentalTypes.filter((id) => id !== typeId));
                          }}
                        />
                        <label
                          htmlFor={`rental-type-${typeId}`}
                          className="flex items-center gap-2 cursor-pointer text-sm font-medium"
                        >
                          <IconComponent size={16} aria-hidden />
                          {type.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <Button
            type="button"
            onClick={() => {
              setSelectedRentalTypes([]);
              setLocationFilter("");
            }}
            variant="outline"
            disabled={selectedRentalTypes.length === 0 && !locationFilter}
          >
            Clear All Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedRentalTypes.length > 0 ? (
              <>
                {selectedRentalTypes
                  .map((typeId) => displayTypes.find((t) => t.id?.toString() === typeId)?.name)
                  .filter(Boolean)
                  .join(", ")}{" "}
                ({filteredProfiles.length})
              </>
            ) : (
              <>Rental / Buy Profiles ({filteredProfiles.length})</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">Loading rental profiles...</p>
          ) : filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No rental profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const typeNames = typeIdsForRental(profile.id)
                  .map((id) => displayTypes.find((t) => t.id === id)?.name)
                  .filter(Boolean) as string[];
                const typeLabel = typeNames.length ? typeNames.join(", ") : "Rental Services";
                const IconComponent = getServiceIcon(typeLabel);

                return (
                  <Card
                    key={profile.id}
                    id={directoryProfileElementId(profile.id)}
                    className={`hover:shadow-lg transition-shadow ${rentalHighlightClass(profile.id)}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" aria-hidden />
                        <CardTitle className="text-lg">{profile.business_name || "Rental Partner"}</CardTitle>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {typeNames.length ? (
                          typeNames.map((n) => (
                            <span key={n} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {n}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{typeLabel}</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Contact Person</p>
                        <p className="font-semibold">{profile.contact_name || "N/A"}</p>
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
                        <p className="text-sm">
                          {[profile.city, profile.state, profile.zip].filter(Boolean).join(", ") ||
                            "Location not specified"}
                        </p>
                      </div>
                      {profile.price != null && (
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
                        <DirectoryProfileLink
                          kind="service_rental_buy"
                          id={profile.id}
                          className="w-full justify-center py-2 border rounded-md border-border"
                        />
                        <Button
                          type="button"
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            window.location.href = `mailto:${profile.email || ""}`;
                          }}
                          disabled={!profile.email}
                        >
                          <Mail className="h-4 w-4 mr-2" aria-hidden />
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
