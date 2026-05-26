/**
 * External Vendor (suppliers) Business Rules categories and types.
 * Stored as free-text in `suppliers.custom_category` and `suppliers.custom_type`
 * (FK columns set to null). "Other" reveals a manual entry for either field.
 */
import {
  Briefcase,
  Scale,
  Camera,
  Flower2,
  Megaphone,
  Gift,
  Sparkles,
  Building,
  type LucideIcon,
} from "lucide-react";

export interface SupplierBusinessCategory {
  name: string;
  icon: LucideIcon;
  types: string[];
  /** When true, type dropdown always allows a manual entry. */
  alwaysCustomType?: boolean;
}

export const SUPPLIER_BUSINESS_CATEGORIES: SupplierBusinessCategory[] = [
  {
    name: "Finance",
    icon: Briefcase,
    types: ["Invoice", "Receipt", "Contract", "Payment Processing"],
  },
  {
    name: "Legal",
    icon: Scale,
    types: ["Contract Review", "Permit", "License", "Insurance"],
  },
  {
    name: "Photography/Videography",
    icon: Camera,
    types: ["Event Photography", "Videography", "Drone", "Photo Booth"],
  },
  {
    name: "Florist",
    icon: Flower2,
    types: ["Centerpieces", "Bouquets", "Ceremony Flowers", "Decorative Arrangements"],
  },
  {
    name: "Signage",
    icon: Megaphone,
    types: ["Banners", "Directional Signs", "Digital Displays", "Custom Signage"],
  },
  {
    name: "Merchandise",
    icon: Gift,
    types: ["Branded Items", "Gifts", "Souvenirs", "Promotional Materials"],
  },
  {
    name: "Specialty Services",
    icon: Sparkles,
    types: ["Custom", "Unique", "Specialty"],
    alwaysCustomType: true,
  },
];

export const SUPPLIER_OTHER_CATEGORY = {
  name: "Other",
  icon: Building,
} as const;

export const supplierCategoryByName = (name: string | null | undefined) =>
  SUPPLIER_BUSINESS_CATEGORIES.find((c) => c.name === name);
