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
  supplier_types?: { name: string };
  supplier_categories?: { name: string };
}

export default function SupplierDirectory() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierTypes, setSelectedSupplierTypes] = useState<string[]>([]);
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
          supplier_types(name),
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

  const uniqueSupplierTypes = [...new Set(suppliers.map(s => s.supplier_types?.name).filter(Boolean))];
  const uniqueCategories = [...new Set(suppliers.map(s => s.supplier_categories?.name).filter(Boolean))];

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesType = selectedSupplierTypes.length === 0 || 
      (supplier.supplier_types?.name && selectedSupplierTypes.includes(supplier.supplier_types.name));
    const matchesCategory = selectedCategories.length === 0 || 
      (supplier.supplier_categories?.name && selectedCategories.includes(supplier.supplier_categories.name));
    const matchesLocation = !locationFilter || 
      [supplier.city, supplier.state, supplier.zip].some(field => 
        field?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    return matchesType && matchesCategory && matchesLocation;
  });

  const handleSupplierTypeChange = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedSupplierTypes([...selectedSupplierTypes, value]);
    } else {
      setSelectedSupplierTypes(selectedSupplierTypes.filter(type => type !== value));
    }
  };

  const handleCategoryChange = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, value]);
    } else {
      setSelectedCategories(selectedCategories.filter(cat => cat !== value));
    }
  };

  const clearAllSelections = () => {
    setSelectedSupplierTypes([]);
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
          <CardTitle>Select Supplier Types</CardTitle>
          <CardDescription>
            Choose all supplier types that apply to your event requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {/* Supplier Types */}
          <div className="space-y-2">
            <Label>Filter by Supplier Type:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueSupplierTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={selectedSupplierTypes.includes(type)}
                    onCheckedChange={(checked) => 
                      handleSupplierTypeChange(type, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={type}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Filter by Category:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {uniqueCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={category}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {(selectedSupplierTypes.length > 0 || selectedCategories.length > 0 || locationFilter) && (
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
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm">{supplier.business_name}</h4>
                        <div className="flex flex-col gap-1">
                          {supplier.supplier_types?.name && (
                            <Badge variant="secondary" className="text-xs">
                              {supplier.supplier_types.name}
                            </Badge>
                          )}
                          {supplier.supplier_categories?.name && (
                            <Badge variant="outline" className="text-xs">
                              {supplier.supplier_categories.name}
                            </Badge>
                          )}
                        </div>
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
                      </div>
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