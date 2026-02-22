import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, MapPin, Star, Linkedin, Instagram, Plus, ExternalLink,
  Building2, Store, Package, Loader2, SearchX, Map
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ResourceProfile {
  id: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  rating: number | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  price: number | null;
  cost: number | null;
  description: string | null;
  source_table: "venues" | "vendors" | "suppliers";
  type_name: string | null;
}

interface UserEvent {
  id: string;
  title: string;
}

const DMV_STATES: Record<string, string[]> = {
  Maryland: ["MD", "Maryland"],
  "Washington DC": ["DC", "Washington DC", "District of Columbia"],
  Virginia: ["VA", "Virginia"],
};

const CATEGORIES = [
  "All",
  "Bookings",
  "Vendors",
  "Venues",
  "Hospitality",
  "Entertainment",
  "Transportation",
  "Suppliers",
  "Services",
  "Marketing",
];

// ─── Component ───────────────────────────────────────────────────────────────
const ResourceExplorer = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<ResourceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("venues");
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [addingId, setAddingId] = useState<string | null>(null);

  // Fetch user events for Quick Add
  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        setUserEvents(data);
        setSelectedEventId(data[0].id);
      }
    };
    fetchEvents();
  }, [user]);

  // Fetch all resource profiles
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const [venuesRes, vendorsRes, suppliersRes, hospRes, entRes] = await Promise.all([
          supabase.from("venue_profiles").select("*, venue_types(name)"),
          supabase.from("serv_vendor_suppliers").select("*, vendor_supplier_types(name)"),
          supabase.from("suppliers").select("*, supplier_types(name), supplier_categories(name)"),
          supabase.from("hospitality_profiles").select("*, hospitality_types(name)"),
          supabase.from("entertainment_profiles").select("*, entertainment_types(name)"),
        ]);

        const all: ResourceProfile[] = [];

        (venuesRes.data || []).forEach((v: any) =>
          all.push({
            id: v.id,
            business_name: v.business_name,
            contact_name: v.contact_name,
            email: v.email,
            phone_number: v.phone_number,
            city: v.city,
            state: v.state,
            zip: v.zip,
            rating: v.rating,
            linkedin_url: v.linkedin_url,
            instagram_url: v.instagram_url,
            price: v.cost,
            cost: v.cost,
            description: null,
            source_table: "venues",
            type_name: v.venue_types?.name || "Venue",
          })
        );

        (vendorsRes.data || []).forEach((v: any) =>
          all.push({
            id: v.id,
            business_name: v.business_name,
            contact_name: v.contact_name,
            email: v.email,
            phone_number: v.phone_number,
            city: v.city,
            state: v.state,
            zip: v.zip,
            rating: v.rating,
            linkedin_url: v.linkedin_url,
            instagram_url: v.instagram_url,
            price: v.price,
            cost: v.price,
            description: v.description,
            source_table: "vendors",
            type_name: v.vendor_supplier_types?.name || "Vendor",
          })
        );

        (suppliersRes.data || []).forEach((v: any) =>
          all.push({
            id: v.id,
            business_name: v.business_name,
            contact_name: v.contact_name,
            email: v.email,
            phone_number: v.phone_number,
            city: v.city,
            state: v.state,
            zip: v.zip,
            rating: v.rating,
            linkedin_url: v.linkedin_url,
            instagram_url: v.instagram_url,
            price: v.price,
            cost: v.price,
            description: v.description,
            source_table: "suppliers",
            type_name: v.supplier_types?.name || "Supplier",
          })
        );

        (hospRes.data || []).forEach((v: any) =>
          all.push({
            id: v.id,
            business_name: v.business_name,
            contact_name: v.contact_name,
            email: v.email,
            phone_number: v.phone_number,
            city: v.city,
            state: v.state,
            zip: v.zip,
            rating: v.rating,
            linkedin_url: v.linkedin_url,
            instagram_url: v.instagram_url,
            price: v.cost,
            cost: v.cost,
            description: null,
            source_table: "venues",
            type_name: v.hospitality_types?.name || "Hospitality",
          })
        );

        (entRes.data || []).forEach((v: any) =>
          all.push({
            id: v.id,
            business_name: v.business_name,
            contact_name: v.contact_name,
            email: v.email,
            phone_number: v.phone_number,
            city: v.city,
            state: v.state,
            zip: v.zip,
            rating: v.rating,
            linkedin_url: v.linkedin_url,
            instagram_url: v.instagram_url,
            price: v.price,
            cost: v.price,
            description: v.description,
            source_table: "vendors",
            type_name: v.entertainment_types?.name || "Entertainment",
          })
        );

        setResources(all);
      } catch (err) {
        console.error("Error fetching resources:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  // Filter logic
  const filtered = useMemo(() => {
    return resources.filter((r) => {
      // Tab filter
      if (activeTab === "venues" && r.source_table !== "venues") return false;
      if (activeTab === "vendors" && r.source_table !== "vendors") return false;
      if (activeTab === "suppliers" && r.source_table !== "suppliers") return false;

      // Region filter
      if (regionFilter !== "All") {
        const validStates = DMV_STATES[regionFilter] || [];
        const match = validStates.some(
          (s) => r.state?.toLowerCase() === s.toLowerCase()
        );
        if (!match) return false;
      }

      // Category filter
      if (categoryFilter !== "All") {
        const typeLower = (r.type_name || "").toLowerCase();
        const catLower = categoryFilter.toLowerCase();
        if (!typeLower.includes(catLower) && catLower !== typeLower) return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          r.business_name,
          r.contact_name,
          r.city,
          r.state,
          r.type_name,
          r.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [resources, activeTab, regionFilter, categoryFilter, searchQuery]);

  // Quick Add handler
  const handleQuickAdd = async (resource: ResourceProfile) => {
    if (!selectedEventId) {
      toast.error("Please select an event first.");
      return;
    }
    setAddingId(resource.id);
    try {
      // Add as a resource to the event's resources table
      const { error } = await supabase.from("resources").insert({
        name: resource.business_name,
        category_id: 1, // default Equipment; user can change later
        location: `${resource.city || ""}, ${resource.state || ""}`.trim().replace(/^,|,$/g, ""),
        event_id: selectedEventId,
        total: 1,
        allocated: 0,
        available: 1,
      });
      if (error) throw error;
      toast.success(`"${resource.business_name}" added to your event!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add resource");
    } finally {
      setAddingId(null);
    }
  };

  // Render star rating
  const renderRating = (rating: number | null) => {
    const r = rating || 0;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${i <= r ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        ))}
        {r > 0 && <span className="text-xs text-muted-foreground ml-1">{r.toFixed(1)}</span>}
      </div>
    );
  };

  // ─── Skeleton ────────────────────────────────────────────────────────────
  const SkeletonCard = () => (
    <div className="rounded-xl border bg-card/60 p-5 space-y-3 animate-pulse">
      <div className="h-5 w-3/4 bg-muted rounded" />
      <div className="h-3 w-1/2 bg-muted rounded" />
      <div className="h-3 w-1/3 bg-muted rounded" />
      <div className="flex gap-2 mt-3">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="h-8 flex-1 rounded bg-muted" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resource Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover venues, vendors &amp; suppliers in the DMV region
          </p>
        </div>
        {userEvents.length > 0 && (
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select event for Quick Add" />
            </SelectTrigger>
            <SelectContent>
              {userEvents.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>
                  {ev.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Search + Filters */}
      <Card className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by keyword (e.g. 'Catering in Baltimore' or 'DC Hotel Venues')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Regions</SelectItem>
                <SelectItem value="Maryland">Maryland</SelectItem>
                <SelectItem value="Washington DC">Washington DC</SelectItem>
                <SelectItem value="Virginia">Virginia</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Venues / Vendors / Suppliers */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="venues" className="gap-2">
            <Building2 className="h-4 w-4" /> Venues
          </TabsTrigger>
          <TabsTrigger value="vendors" className="gap-2">
            <Store className="h-4 w-4" /> Vendors
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Package className="h-4 w-4" /> Suppliers
          </TabsTrigger>
        </TabsList>

        {["venues", "vendors", "suppliers"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              /* Empty State */
              <Card className="rounded-xl mt-4">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <SearchX className="h-12 w-12 text-muted-foreground/40" />
                  <div>
                    <h3 className="text-lg font-semibold">No resources found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try adjusting your filters or search for external sources.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      const q = encodeURIComponent(
                        `${searchQuery || tab} ${regionFilter !== "All" ? regionFilter : "DMV"}`
                      );
                      window.open(`https://www.google.com/maps/search/${q}`, "_blank");
                    }}
                  >
                    <Map className="h-4 w-4" />
                    Search Google Maps
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Resource Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {filtered.map((r) => (
                  <Card
                    key={`${r.source_table}-${r.id}`}
                    className="rounded-xl border bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <CardTitle className="text-base font-bold truncate">
                            {r.business_name}
                          </CardTitle>
                          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {r.type_name}
                          </span>
                        </div>
                        {r.cost != null && (
                          <span className="text-sm font-semibold text-primary whitespace-nowrap">
                            ${Number(r.cost).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {[r.city, r.state].filter(Boolean).join(", ") || "No location"}
                        </span>
                      </div>

                      {/* Rating */}
                      {renderRating(r.rating)}

                      {/* Description */}
                      {r.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {r.description}
                        </p>
                      )}

                      {/* Actions row */}
                      <div className="flex items-center gap-2 pt-1">
                        {/* Social Links */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          disabled={!r.linkedin_url}
                          onClick={() => r.linkedin_url && window.open(r.linkedin_url, "_blank")}
                          title="LinkedIn"
                        >
                          <Linkedin className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          disabled={!r.instagram_url}
                          onClick={() => r.instagram_url && window.open(r.instagram_url, "_blank")}
                          title="Instagram"
                        >
                          <Instagram className="h-4 w-4" />
                        </Button>

                        {/* Quick Add */}
                        <Button
                          size="sm"
                          className="ml-auto gap-1.5"
                          disabled={addingId === r.id || !selectedEventId}
                          onClick={() => handleQuickAdd(r)}
                        >
                          {addingId === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          Quick Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ResourceExplorer;
