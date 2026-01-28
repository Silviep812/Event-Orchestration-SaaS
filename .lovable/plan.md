

# Add Vendors Page to Sidebar Resources

## Overview

Create a new "Vendors" link in the sidebar under the Resources section, linking to a new dedicated Vendors page that consolidates vendor management.

## Changes Required

### 1. Add Sidebar Menu Item

**File:** `src/components/AppSidebar.tsx`

Add a new item to the Resources group (around line 136, after "Planning Assets"):

```typescript
{
  title: "Vendors",
  url: "/dashboard/vendors",
  icon: Store,  // New import from lucide-react
  color: "text-orange-600",
  hoverColor: "hover:bg-orange-50"
},
```

Also add `Store` to the lucide-react imports at the top of the file.

### 2. Create Vendors Page

**File:** `src/pages/VendorsDirectory.tsx` (new file)

Create a new page that provides a unified vendor management experience:

| Feature | Description |
|---------|-------------|
| Vendor List | Display all vendors from the database |
| Search & Filter | Filter by vendor type, name, or location |
| Contact Actions | Email and phone buttons for each vendor |
| Type Categories | Group/filter vendors by type (caterer, florist, etc.) |

The page will follow the existing pattern from `ServiceVendorDirectory.tsx` but serve as the primary vendor hub.

### 3. Add Route

**File:** `src/App.tsx`

Add import and route:

```typescript
// Import (around line 30)
import VendorsDirectory from "./pages/VendorsDirectory";

// Route (around line 77, before "profile")
<Route path="vendors" element={<VendorsDirectory />} />
```

## Technical Details

### New Icon Import

The `Store` icon from lucide-react will be used for the Vendors menu item, representing a vendor/business directory.

### Database Tables Used

The page will query the existing `serv_vendor_suppliers` table with its related `vendor_supplier_types` table - same data source as `ServiceVendorDirectory.tsx`.

### File Structure After Changes

```text
src/
  components/
    AppSidebar.tsx  (modified - add Vendors menu item)
  pages/
    VendorsDirectory.tsx  (new)
  App.tsx  (modified - add route)
```

### Sidebar Resources Section After Change

The Resources section will include:
1. Planning Assets
2. **Vendors** (new)
3. Themes
4. Bookings
5. Venues
6. Hospitality
7. Vendor Service Rental/Buy
8. Service Vendor
9. Transportation
10. Entertainment
11. Suppliers
12. Generate Reports

