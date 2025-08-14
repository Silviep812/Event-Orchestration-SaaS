import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Package, Building } from "lucide-react";

interface Supplier {
  id: string;
  supplier_type: string;
  business_name: string;
  contact_name: string;
  email: string;
  contact_nbr: string;
  location: string;
  category: "online" | "wholesaler" | "distributor" | "merchandizer";
}

interface SupplierSelectorProps {
  onSelectSupplier: (supplier: Supplier) => void;
  selectedSupplier: Supplier | null;
}

// Mock supplier data - in real app, this would come from the Supplier Directory table
const mockSuppliers: Supplier[] = [
  {
    id: "1",
    supplier_type: "Party Supplies",
    business_name: "Party Central Online",
    contact_name: "Amanda Wilson",
    email: "amanda@partycentral.com",
    contact_nbr: "555-0201",
    location: "Orlando, FL 32801",
    category: "online"
  },
  {
    id: "2",
    supplier_type: "Decorations",
    business_name: "Wholesale Decorations Inc",
    contact_name: "Michael Brown",
    email: "michael@wholesaledecorations.com",
    contact_nbr: "555-0202",
    location: "Los Angeles, CA 90015",
    category: "wholesaler"
  },
  {
    id: "3",
    supplier_type: "Flowers & Plants",
    business_name: "Garden Supply Distributors",
    contact_name: "Lisa Green",
    email: "lisa@gardensupply.com",
    contact_nbr: "555-0203",
    location: "Portland, OR 97201",
    category: "distributor"
  },
  {
    id: "4",
    supplier_type: "Linens & Fabrics",
    business_name: "Textile Merchants Corp",
    contact_name: "James Taylor",
    email: "james@textilemerchants.com",
    contact_nbr: "555-0204",
    location: "New York, NY 10018",
    category: "merchandizer"
  },
  {
    id: "5",
    supplier_type: "Catering Supplies",
    business_name: "Food Service Wholesale",
    contact_name: "Rachel Martinez",
    email: "rachel@foodservicewholesale.com",
    contact_nbr: "555-0205",
    location: "Chicago, IL 60661",
    category: "wholesaler"
  },
  {
    id: "6",
    supplier_type: "Event Furniture",
    business_name: "Online Event Rentals",
    contact_name: "Kevin Park",
    email: "kevin@onlineeventrentals.com",
    contact_nbr: "555-0206",
    location: "Dallas, TX 75201",
    category: "online"
  }
];

const getCategoryIcon = (category: string) => {
  const iconClass = "h-3 w-3";
  switch (category) {
    case "online": return <Package className={iconClass} />;
    case "wholesaler": return <Building className={iconClass} />;
    case "distributor": return <MapPin className={iconClass} />;
    case "merchandizer": return <Building className={iconClass} />;
    default: return <Package className={iconClass} />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
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

  const filteredSuppliers = mockSuppliers.filter(supplier => {
    const matchesLocation = !locationFilter || 
      supplier.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = !typeFilter || 
      supplier.supplier_type.toLowerCase().includes(typeFilter.toLowerCase());
    const matchesCategory = !categoryFilter || supplier.category === categoryFilter;
    return matchesLocation && matchesType && matchesCategory;
  });

  const supplierTypes = [...new Set(mockSuppliers.map(supplier => supplier.supplier_type))];
  const categories = [...new Set(mockSuppliers.map(supplier => supplier.category))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Suppliers
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
              <Label htmlFor="supplier-type">Filter by Supply Type</Label>
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

          {/* Supplier Categories */}
          <div className="space-y-2">
            <Label>Supplier Categories:</Label>
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

          {/* Supplier List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {filteredSuppliers.map((supplier) => (
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
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(supplier.category)}`}
                      >
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(supplier.category)}
                          {supplier.category}
                        </span>
                      </Badge>
                    </div>

                    <Badge variant="secondary" className="text-xs">
                      {supplier.supplier_type}
                    </Badge>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="text-xs">{supplier.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="text-xs">{supplier.contact_nbr}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="text-xs">{supplier.email}</span>
                      </div>
                      <p className="text-xs"><strong>Contact:</strong> {supplier.contact_name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No suppliers found matching your criteria.</p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          )}

          {selectedSupplier && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Selected Supplier</h4>
              <div className="text-sm">
                <p><strong>{selectedSupplier.business_name}</strong></p>
                <p>{selectedSupplier.supplier_type} ({selectedSupplier.category})</p>
                <p className="text-muted-foreground">{selectedSupplier.location}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}