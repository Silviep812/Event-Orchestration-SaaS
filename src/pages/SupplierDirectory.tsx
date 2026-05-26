import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Truck, ShoppingCart, Store, Building, MapPin, Mail } from "lucide-react";
import { DirectoryPageHeader } from "@/components/resource-directory/DirectoryPageHeader";
import { AddDirectoryEntryDialog } from "@/components/resource-directory/AddDirectoryEntryDialog";
import { formatDirectoryPrice } from "@/lib/formatDirectoryPrice";
import { DirectoryProfileLink } from "@/components/resource-directory/DirectoryProfileLink";
import { directoryProfileElementId } from "@/lib/directoryProfileLinks";
import { useDirectoryProfileHighlight } from "@/hooks/useDirectoryProfileHighlight";

interface Supplier {
  id: string;
  business_name: string;
  contact_name?: string;
  email?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  /** PDF / schema: distinct from list or quote `price` when both are tracked */
  supplier_cost?: number | null;
  description?: string;
  supplier_types?: { name: string };
  supplier_categories?: { name: string };
}

export default function SupplierDirectory() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierCategories, setSupplierCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const { highlightClass } = useDirectoryProfileHighlight(loading);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const [suppliersRes, categoriesRes] = await Promise.all([
        supabase.from('suppliers').select(`*, supplier_categories(name)`),
        supabase.from('supplier_categories').select('id, name'),
      ]);

      if (suppliersRes.error) {
        console.error('Error fetching external vendors:', suppliersRes.error);
      } else {
        setSuppliers(suppliersRes.data || []);
      }
      if (!categoriesRes.error && categoriesRes.data) {
        setSupplierCategories(categoriesRes.data as { id: number; name: string }[]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const supplierCategoryOptions = [
    { value: "distributor", label: "Distributor", icon: Truck },
    { value: "wholesaler", label: "Wholesaler", icon: Package },
    { value: "food_wholesaler", label: "Food Wholesaler", icon: Package },
    { value: "online", label: "Online Market", icon: ShoppingCart },
    { value: "merchandizer", label: "Merchandizer", icon: Store },
    { value: "other", label: "Other", icon: Building },
  ];

  const uniqueCategories = [...new Set(suppliers.map(s => s.supplier_categories?.name).filter(Boolean))];

  const normCat = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, "");
  const filteredSuppliers = suppliers.filter(supplier => {
    const dbName = supplier.supplier_categories?.name;
    const matchesCategory =
      selectedCategories.length === 0 ||
      (dbName != null &&
        selectedCategories.some((sel) => normCat(sel) === normCat(dbName)));
    const matchesLocation = !locationFilter || 
      [supplier.city, supplier.state, supplier.zip].some(field => 
        field?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    return matchesCategory && matchesLocation;
  });

  const handleCategoryChange = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, value]);
    } else {
      setSelectedCategories(selectedCategories.filter(cat => cat !== value));
    }
  };

  const clearAllSelections = () => {
    setSelectedCategories([]);
    setLocationFilter("");
  };

  return (
    <div className="space-y-6">
      <DirectoryPageHeader
        title="External Vendor Directory"
        subtitle="Filter by category, then browse vendor profiles"
        action={
          <AddDirectoryEntryDialog
            title="Add External Vendor"
            table="suppliers"
            typeColumn="category_id"
            customColumn="custom_category"
            typeLabel="Category"
            typeOptions={supplierCategories.map((c) => ({ id: c.id, name: c.name }))}
            onCreated={fetchSuppliers}
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Select External Vendor Categories</CardTitle>
          <CardDescription>
            Choose all external vendor categories that apply to your event requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* External vendor categories */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplierCategoryOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={selectedCategories.includes(option.value)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(option.value, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={option.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <Label htmlFor="location">Filter by Location</Label>
            <Input
              id="location"
              placeholder="Enter city, state, or ZIP code"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>

          {(selectedCategories.length > 0 || locationFilter) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredSuppliers.length} of {suppliers.length} vendor profiles
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllSelections}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedCategories.length > 0 ? (
              <>
                {selectedCategories.map(catValue => 
                  supplierCategoryOptions.find(opt => opt.value === catValue)?.label
                ).filter(Boolean).join(', ')} ({filteredSuppliers.length})
              </>
            ) : (
              <>External Vendor Profiles ({filteredSuppliers.length})</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading vendor profiles…</p>
          ) : filteredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((supplier) => (
                <Card
                  key={supplier.id}
                  id={directoryProfileElementId(supplier.id)}
                  className={`hover:shadow-md transition-all ${highlightClass(supplier.id)}`}
                >
                  <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm">{supplier.business_name}</h4>
                          {supplier.supplier_categories?.name && (
                            <p className="text-sm text-primary font-medium">
                              {supplier.supplier_categories.name}
                            </p>
                          )}
                          {supplier.description && (
                            <p className="text-xs text-muted-foreground italic">
                              {supplier.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground">
                        {supplier.contact_name && (
                          <p className="text-xs"><strong>Contact:</strong> {supplier.contact_name}</p>
                        )}
                        {supplier.email?.trim() && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            <a
                              href={`mailto:${String(supplier.email).trim()}`}
                              className="text-xs text-primary hover:underline break-all"
                            >
                              {supplier.email}
                            </a>
                          </div>
                        )}
                        {(supplier.city || supplier.state || supplier.zip) && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">
                              {[supplier.city, supplier.state, supplier.zip].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        {supplier.price != null && String(supplier.price) !== "" && (
                          <p className="text-sm font-semibold text-primary mt-2">
                            Starting at {formatDirectoryPrice(supplier.price) ?? String(supplier.price)}
                          </p>
                        )}
                        {supplier.supplier_cost != null && (
                          <p className="text-sm font-medium text-muted-foreground">
                            External vendor cost: ${Number(supplier.supplier_cost).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 mt-3">
                        <DirectoryProfileLink kind="supplier" id={supplier.id} className="w-full justify-center py-1.5 border rounded-md border-border" />
                        <Button className="w-full" size="sm" onClick={() => supplier.email && window.open(`mailto:${supplier.email}`)} disabled={!supplier.email}>
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vendors match your filters.</p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}