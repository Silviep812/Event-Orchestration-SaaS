import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Truck, ShoppingCart, Store, Building, MapPin, Phone, Mail } from "lucide-react";

interface Supplier {
  id: string;
  business_name: string;
  contact_name?: string;
  email?: string;
  phone_number?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  supplier_types?: { name: string };
  supplier_categories?: { name: string };
}

export default function SupplierDirectory() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);

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
          supplier_categories(name)
        `);

      if (error) {
        console.error('Error fetching suppliers:', error);
      } else {
        setSuppliers(data || []);
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

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesCategory = selectedCategories.length === 0 || 
      (supplier.supplier_categories?.name && selectedCategories.includes(supplier.supplier_categories.name));
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
      <div>
        <h1 className="text-3xl font-bold">Supplier Directory</h1>
        <p className="text-muted-foreground">
          Browse and select suppliers for your event needs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Supplier Categories</CardTitle>
          <CardDescription>
            Choose all supplier categories that apply to your event requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Supplier Categories */}
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
                Showing {filteredSuppliers.length} of {suppliers.length} suppliers
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
          <CardTitle>Supplier Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading supplier profiles...</p>
          ) : filteredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">{supplier.business_name}</h4>
                        {supplier.supplier_categories?.name && (
                          <p className="text-sm text-primary font-medium">
                            {supplier.supplier_categories.name}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {supplier.contact_name && (
                          <p className="text-xs"><strong>Contact:</strong> {supplier.contact_name}</p>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs">{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">{supplier.phone_number}</span>
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
                        {supplier.price && (
                          <p className="text-sm font-semibold text-primary mt-2">
                            Starting at ${supplier.price.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Button className="w-full mt-3" size="sm">
                        Place Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No suppliers found matching your criteria.</p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}