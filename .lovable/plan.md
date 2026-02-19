
## Change Sidebar Label: "Vendor Service Rental/Buy" → "Rental Service"

### File to Edit
`src/components/AppSidebar.tsx`

### Change
In the `menuGroups` array, under the "Resources" group, update the `title` field of the item with `url: "/dashboard/vendor-service"`:

- **Before:** `title: "Vendor Service Rental/Buy"`
- **After:** `title: "Rental Service"`

No other files need to change. The URL, icon, and all other properties remain untouched.
