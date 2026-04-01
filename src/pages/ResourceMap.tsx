import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, ExternalLink } from "lucide-react";

interface VenueRow {
  id: string;
  business_name: string;
  city: string | null;
  state: string | null;
  zip: string | null;
}

function mapsQuery(v: VenueRow): string {
  return [v.business_name, v.city, v.state, v.zip].filter(Boolean).join(", ");
}

export default function ResourceMap() {
  const { toast } = useToast();
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("venues")
        .select("id, business_name, city, state, zip")
        .order("business_name");

      if (error) {
        toast({
          variant: "destructive",
          title: "Could not load venues",
          description: error.message,
        });
        setVenues([]);
      } else {
        setVenues((data ?? []) as VenueRow[]);
      }
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter(
      (v) =>
        v.business_name.toLowerCase().includes(q) ||
        (v.city ?? "").toLowerCase().includes(q) ||
        (v.state ?? "").toLowerCase().includes(q)
    );
  }, [venues, filter]);

  const byLocation = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of filtered) {
      const key = [v.city, v.state].filter(Boolean).join(", ") || "Unknown";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MapPin className="h-8 w-8 text-primary" />
          Resource map
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Multi-location venue directory (Deliverable 2). Open any row in Google Maps; filter by name or city.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
          <CardDescription>
            {byLocation.length > 0 && (
              <span className="block mt-2 text-xs">
                {byLocation.slice(0, 5).map(([loc, n]) => (
                  <span key={loc} className="mr-3">
                    {loc}: {n}
                  </span>
                ))}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Filter by name, city, or state…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">No venues match.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {filtered.map((v) => {
                const q = mapsQuery(v);
                const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
                return (
                  <li
                    key={v.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
                  >
                    <div>
                      <div className="font-medium">{v.business_name}</div>
                      <div className="text-muted-foreground">
                        {[v.city, v.state, v.zip].filter(Boolean).join(", ") || "—"}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Map
                      </a>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
