/**
 * Builds the Resources location picker.
 *
 * Acceptance testing (M5 Task 2 V1.3 UI/UX, "Other Issues") found the Sidebar > Resources
 * location search contained only Maryland test data. The picker was built from
 * `resources.location`, a free-text column holding 36 Maryland rows plus unstructured values
 * like "Convention Center" and "4234" — so there was no way to search the other ten states.
 *
 * Coverage now comes from `directory_service_areas`, which carries all 11 supported states
 * (DC, MD, VA, NJ, PA, NY, MA, IL, GA, FL) as structured city/state rows. Existing
 * `resources.location` values are merged in rather than replaced, so no already-saved
 * resource becomes unfilterable.
 */

export type ServiceAreaOption = { city: string | null; state: string | null };

/** "Baltimore, MD" — omits either half if missing rather than emitting a stray comma. */
export function formatServiceArea(area: ServiceAreaOption): string {
  return [area.city, area.state]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * Merges service-area coverage with any location already recorded on a resource.
 *
 * Deduplicates case-insensitively, keeping the first spelling seen: service areas are listed
 * first, so their canonical "Baltimore, MD" wins over a hand-typed "baltimore, md".
 */
export function buildResourceLocationOptions(
  serviceAreas: ServiceAreaOption[],
  resourceLocations: (string | null | undefined)[],
): string[] {
  const pool = [
    ...serviceAreas.map(formatServiceArea),
    ...resourceLocations.map((value) => value ?? ""),
  ];

  const byKey = new Map<string, string>();
  for (const raw of pool) {
    const value = (raw ?? "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, value);
  }

  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}
