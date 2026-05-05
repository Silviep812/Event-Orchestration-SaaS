/**
 * Maps `resource_categories.name` (seed + custom) to a directory route where planners open profiles.
 * Used to validate categories are linked and to deep-link from resource UI when helpful.
 */
export const RESOURCE_CATEGORY_DIRECTORY_ROUTES: Record<
  string,
  { path: string; label: string }
> = {
  Equipment: { path: "/dashboard/vendor-service", label: "Vendor / service directory" },
  Personnel: { path: "/dashboard/service-vendor", label: "Service vendor directory" },
  Venue: { path: "/dashboard/venue", label: "Venue directory" },
  Hospitality: { path: "/dashboard/hospitality", label: "Hospitality directory" },
  Transportation: { path: "/dashboard/transportation", label: "Transportation directory" },
  Supplies: { path: "/dashboard/supplier", label: "External vendor directory" },
  Marketing: { path: "/dashboard/marketing-campaign", label: "Marketing campaign" },
  Entertainment: { path: "/dashboard/entertainment", label: "Entertainment directory" },
};

export function directoryLinkForResourceCategoryName(name: string): { path: string; label: string } | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return RESOURCE_CATEGORY_DIRECTORY_ROUTES[trimmed] ?? null;
}

/** Returns category names that have no directory mapping (should be empty in production). */
export function resourceCategoriesMissingDirectory(
  categories: { id: number; name: string }[],
): string[] {
  const missing: string[] = [];
  for (const c of categories) {
    const n = c.name?.trim();
    if (!n) {
      missing.push(`(id ${c.id}, empty name)`);
      continue;
    }
    if (!directoryLinkForResourceCategoryName(n)) missing.push(n);
  }
  return missing;
}
