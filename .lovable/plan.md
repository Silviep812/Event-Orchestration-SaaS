# Add-Entry Forms for Resource Directories ("Other" custom type)

## Goal
Every listed resource directory gets an "+ Add Entry" button that opens a dialog with a type/category dropdown. The dropdown ends in "Other", which reveals a free-text input for a custom value saved to the entry.

## Scope (in)
Directory pages that get a new add dialog:
1. **Venue** (`VenueDirectory.tsx` → table `venues`) — already has form in `VenueSelector`; mirror it on the directory page too
2. **Entertainment** (`EntertainmentDirectory.tsx` → `entertainments`)
3. **Transportation** (`TransportationDirectory.tsx` → `transportations`)
4. **Vendor / Service Rental** (`VendorServiceDirectory.tsx` → `vendor`, type from `vendor_rental_types`)
5. **Supplier / External Vendor** (`SupplierDirectory.tsx` → `suppliers`, category from `supplier_categories`)
6. **Service Vendor** (`ServiceVendorDirectory.tsx` → `service_vendor_profiles` or `suppliers` — confirm at impl time)
7. **Marketing Campaigns** (`MarketingCampaign.tsx` → `marketing_campaigns`)
8. **Marketing Creatives** (`MarketingCreatives.tsx` → `marketing_creatives` or `marketing_emails`)

Out of scope: Planning Assets, Hospitality, Themes, Bookings (per request).

## UX pattern (identical on every directory)
- Header gets an **"+ Add Entry"** button (admin-visible only; hidden for Read-Only users).
- Clicking opens a Dialog with:
  - Standard fields for that entity (name, contact, email, phone, city/state/zip, etc.)
  - **Type/Category** `<Select>` populated from the existing type table, with an extra `<SelectItem value="__other__">Other…</SelectItem>` pinned at the bottom.
  - When `__other__` is chosen, a `<Input placeholder="Enter custom type">` appears below.
- On Save: `type_id = null`, `custom_type = <typed text>` (otherwise `type_id = <id>`, `custom_type = null`).
- Sonner toast on success; list auto-refreshes (refetch).

## Database changes (one migration)
Add nullable `custom_type TEXT` column to each entry table that doesn't already have one:
- `venues.custom_type`
- `entertainments.custom_type`
- `transportations.custom_type`
- `vendor.custom_type`
- `suppliers.custom_category`
- `service_vendor_profiles.custom_type` (if table exists)
- `marketing_campaigns.custom_type`
- `marketing_creatives.custom_type` (or equivalent table)

No RLS changes needed if INSERT policies already allow `user_id = auth.uid()`. Audit during implementation; add policies only where missing.

## Display
Directory cards already render the type's name from the joined type table. Update each card to fall back to `custom_type` text when `type_id` is null.

## Reusable component
Create `src/components/resource-directory/TypeSelectWithOther.tsx`:
- Props: `value`, `onValueChange`, `customValue`, `onCustomChange`, `options: {id, name}[]`, `label`, `placeholder`
- Renders Select + conditional Input. Used by all 8 new dialogs.

## Implementation order
1. Migration adding `custom_type` columns (single call, requires approval).
2. `TypeSelectWithOther` component.
3. Eight `<Entity>AddDialog.tsx` components in `src/components/resource-directory/`.
4. Mount each in its directory page header.
5. Update each directory card's type-label rendering to use `custom_type` fallback.
6. Smoke test by opening each dialog in preview.

## Technical notes
- Use `as any` casts where Supabase generated types lag the new column (per project convention).
- Hide the "+ Add Entry" button for Read-Only role (per memory rule).
- All Supabase queries stay scoped to `user_id`/`event_id` per project memory.
- No `console.*`; use Sonner toasts only.

## Open question
Service Vendor vs Supplier: confirm whether `ServiceVendorDirectory.tsx` writes to `service_vendor_profiles` (separate table) or to `suppliers`. I'll inspect during step 3 and adjust; flagging here so the migration covers the right table.

## Estimate
Roughly 1 migration + 1 shared component + 8 dialogs + 8 page edits + 8 card-label tweaks. Expect a sizable diff (~15 files).
