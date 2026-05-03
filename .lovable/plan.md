## Add "Supplier" to Sidebar → Resources

### Observation
`src/components/AppSidebar.tsx` Resources section (lines 178–256) already contains an "External Vendors" link pointing to `/dashboard/supplier` (the `SupplierDirectory` page). There is no item literally labeled "Supplier".

### Change
Add a new `Supplier` menu item to the Resources group in `src/components/AppSidebar.tsx`, placed at the end of the items array (after "Resource map"):

```ts
{
  title: "Supplier",
  url: "/dashboard/supplier",
  icon: Package,
  color: "text-orange-600",
  hoverColor: "hover:bg-orange-50"
}
```

This routes to the existing `SupplierDirectory` page (already registered in the router via `/dashboard/supplier`). No new page or route is needed.

### Note
The existing "External Vendors" entry also targets `/dashboard/supplier`. If you'd prefer to rename "External Vendors" → "Supplier" instead of adding a duplicate link, say so and I'll swap the label rather than add a new item.