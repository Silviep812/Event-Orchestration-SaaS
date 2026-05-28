import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Plus, Trash2, Loader2 } from "lucide-react";

interface LocationRow {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export function EventLocationManager({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", zip: "" });

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("cm_locations")
      .select("id, name, address, city, state, zip")
      .eq("event_id", eventId)
      .order("name");
    if (error) {
      console.warn("cm_locations load:", error);
    }
    setLocations((data as LocationRow[]) || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  const addLocation = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("cm_locations").insert({
      event_id: eventId,
      name: form.name.trim(),
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zip: form.zip.trim() || null,
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to add location", description: error.message, variant: "destructive" });
      return;
    }
    setForm({ name: "", address: "", city: "", state: "", zip: "" });
    setDialogOpen(false);
    toast({ title: "Location added" });
    void load();
  };

  const removeLocation = async (id: string) => {
    const { error } = await supabase.from("cm_locations").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Location removed" });
    void load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Event Locations
          </CardTitle>
          <CardDescription>
            Manage locations for this event. Locations can be selected when creating change requests.
          </CardDescription>
        </div>
        <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Location
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading locations…
          </div>
        ) : locations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No locations added yet. Add a location to enable multi-location change requests.
          </p>
        ) : (
          <ul className="space-y-2">
            {locations.map((loc) => (
              <li key={loc.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <span className="font-medium">{loc.name}</span>
                  {loc.address && <span className="text-muted-foreground ml-2">— {loc.address}</span>}
                  {(loc.city || loc.state || loc.zip) && (
                    <span className="text-muted-foreground ml-1">
                      ({[loc.city, loc.state, loc.zip].filter(Boolean).join(", ")})
                    </span>
                  )}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => void removeLocation(loc.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Event Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Location Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Main Venue, Parking Lot B"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  placeholder="e.g. NJ"
                />
              </div>
              <div>
                <Label>ZIP</Label>
                <Input
                  value={form.zip}
                  onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" className="flex-1" disabled={saving || !form.name.trim()} onClick={() => void addLocation()}>
                {saving ? "Saving…" : "Add Location"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
