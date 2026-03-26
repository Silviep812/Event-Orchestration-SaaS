import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Package, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  onSelectSupplier: (supplier: Supplier) => void;
  selectedSupplier: Supplier | null;
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

export function SupplierSelector({ onSelectSupplier, selectedSupplier }: SupplierSelectorProps) {
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
        console.error('Error fetching external vendors:', error);
      } else {
        setSuppliers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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
              <Label htmlFor="supplier-type">Filter by external vendor supply type</Label>
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
            <Label>External vendor categories:</Label>
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

          {/* External vendor list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Loading external vendors...</p>
              </div>
            ) : filteredSuppliers.map((supplier) => {
              const location = [supplier.city, supplier.state, supplier.zip].filter(Boolean).join(', ');
              return (
                <Card 
                  key={supplier.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedSupplier?.id === supplier.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => onSelectSupplier(supplier)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm">{supplier.business_name}</h4>
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
                        {supplier.phone_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">{supplier.phone_number}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs">{supplier.email}</span>
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
              <p>No external vendors found matching your criteria.</p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          )}

          {selectedSupplier && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Selected external vendor</h4>
              <div className="text-sm">
                <p><strong>{selectedSupplier.business_name}</strong></p>
                {selectedSupplier.supplier_types?.name && (
                  <p>{selectedSupplier.supplier_types.name} {selectedSupplier.supplier_categories?.name && `(${selectedSupplier.supplier_categories.name})`}</p>
                )}
                <p className="text-muted-foreground">
                  {[selectedSupplier.city, selectedSupplier.state, selectedSupplier.zip].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}