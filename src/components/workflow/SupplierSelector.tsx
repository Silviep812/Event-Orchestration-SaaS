import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Mail, Package, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { workflowPlannerCopy } from "@/lib/nudges";

interface Supplier {
  id: string;
  business_name: string;
  contact_name?: string;
  email?: string;
  phone_number?: string;
  city?: string;
  state?: string;
  zip?: string;
  supplier_types?: { name: string };
  supplier_categories?: { name: string };
}

interface SupplierSelectorProps {
  /** Selected procurement vendor ids from `suppliers` (not equipment/rental vendors). */
  selectedSupplierIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  /** Called when the user finishes the step (multi-select). */
  onContinue: () => void;
}

const getCategoryIcon = (category: string) => {
  const iconClass = "h-3 w-3";
  switch (category?.toLowerCase()) {
    case "online": return <Package className={iconClass} />;
    case "wholesaler": return <Building className={iconClass} />;
    case "distributor": return <MapPin className={iconClass} />;
    case "merchandizer": return <Building className={iconClass} />;
    default: return <Package className={iconClass} />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case "online": return "bg-blue-100 text-blue-800";
    case "wholesaler": return "bg-green-100 text-green-800";
    case "distributor": return "bg-purple-100 text-purple-800";
    case "merchandizer": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export function SupplierSelector({
  selectedSupplierIds,
  onSelectedIdsChange,
  onContinue,
}: SupplierSelectorProps) {
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select(`
          *,
          supplier_types(name),
          supplier_categories(name)
        `);

      if (error) {
        console.error("Error fetching suppliers:", error);
        toast({
          title: "Error loading vendors",
          description: error.message,
          variant: "destructive",
        });
        setSuppliers([]);
      } else {
        setSuppliers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSupplier = (id: string) => {
    onSelectedIdsChange(
      selectedSupplierIds.includes(id)
        ? selectedSupplierIds.filter((x) => x !== id)
        : [...selectedSupplierIds, id],
    );
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const location = [supplier.city, supplier.state, supplier.zip].filter(Boolean).join(', ');
    const matchesLocation = !locationFilter || 
      location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = !typeFilter || 
      supplier.supplier_types?.name?.toLowerCase().includes(typeFilter.toLowerCase());
    const matchesCategory = !categoryFilter || 
      supplier.supplier_categories?.name?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesLocation && matchesType && matchesCategory;
  });

  const supplierTypes = [...new Set(suppliers.map(s => s.supplier_types?.name).filter(Boolean))];
  const categories = [...new Set(suppliers.map(s => s.supplier_categories?.name).filter(Boolean))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select External Vendors
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal mt-1">{workflowPlannerCopy.supplierSelectorHelper}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Filter by Location (City, State, ZIP)</Label>
              <Input
                id="location"
                placeholder="Enter city, state, or ZIP code"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-type">Filter by supply type</Label>
              <Input
                id="supplier-type"
                placeholder="Enter supply type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Filter by Category</Label>
              <select
                id="category"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Available Supply Types */}
          <div className="space-y-2">
            <Label>Available Supply Types:</Label>
            <div className="flex flex-wrap gap-2">
              {supplierTypes.map((type) => (
                <Badge 
                  key={type} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setTypeFilter(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* External vendor categories */}
          <div className="space-y-2">
            <Label>Vendor categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge 
                  key={category} 
                  variant="secondary"
                  className={`cursor-pointer ${getCategoryColor(category)} hover:opacity-80`}
                  onClick={() => setCategoryFilter(category)}
                >
                  <span className="flex items-center gap-1">
                    {getCategoryIcon(category)}
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Vendor list (procurement / suppliers table) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Loading vendors…</p>
              </div>
            ) : filteredSuppliers.map((supplier) => {
              const location = [supplier.city, supplier.state, supplier.zip].filter(Boolean).join(', ');
              const selected = selectedSupplierIds.includes(supplier.id);
              return (
                <Card 
                  key={supplier.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selected ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => toggleSupplier(supplier.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleSupplier(supplier.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5"
                            aria-label={`Select ${supplier.business_name}`}
                          />
                          <h4 className="font-semibold text-sm">{supplier.business_name}</h4>
                        </div>
                        {supplier.supplier_categories?.name && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCategoryColor(supplier.supplier_categories.name)}`}
                          >
                            <span className="flex items-center gap-1">
                              {getCategoryIcon(supplier.supplier_categories.name)}
                              {supplier.supplier_categories.name}
                            </span>
                          </Badge>
                        )}
                      </div>

                      {supplier.supplier_types?.name && (
                        <Badge variant="secondary" className="text-xs">
                          {supplier.supplier_types.name}
                        </Badge>
                      )}
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">{location}</span>
                          </div>
                        )}
                        {supplier.email?.trim() && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            <a
                              href={`mailto:${String(supplier.email).trim()}`}
                              className="text-xs text-primary hover:underline break-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {supplier.email}
                            </a>
                          </div>
                        )}
                        {supplier.contact_name && (
                          <p className="text-xs"><strong>Contact:</strong> {supplier.contact_name}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!loading && filteredSuppliers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vendors match your filters.</p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between p-4 bg-muted/40 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>{selectedSupplierIds.length}</strong> vendor{selectedSupplierIds.length === 1 ? "" : "s"} selected
            </p>
            <Button type="button" onClick={onContinue}>
              {selectedSupplierIds.length === 0
                ? "Continue without vendors"
                : `Continue with ${selectedSupplierIds.length} vendor${selectedSupplierIds.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}