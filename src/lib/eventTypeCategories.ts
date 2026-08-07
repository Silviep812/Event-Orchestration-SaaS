/**
 * Pure helpers for the directory → category → type hierarchy.
 *
 * Kept free of the Supabase client so they stay unit-testable (see `themeCategoryTags.test.ts`).
 */

/** Case/whitespace-insensitive key for comparing category and type labels. */
export function eventTypeNameKey(name: string | null | undefined): string {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Legacy seeds left duplicate `event_types` rows with the same label under one parent, which
 * surfaced in acceptance testing as "Create event > category > Has Double Entries". Keep the row
 * that actually has children (else the lowest id) so the dropdown lists each label once.
 */
export function dedupeEventTypeRowsByName<T extends { id: number; name: string | null }>(
  rows: T[],
  childCountById?: (id: number) => number,
): T[] {
  const byKey = new Map<string, T>();
  for (const row of [...rows].sort((a, b) => a.id - b.id)) {
    const key = eventTypeNameKey(row.name);
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, row);
      continue;
    }
    if (childCountById && childCountById(row.id) > childCountById(existing.id)) {
      byKey.set(key, row);
    }
  }
  return [...byKey.values()];
}

/**
 * The catalog can hold more than one row for the same theme (a duplicate "Dining" was reported in
 * the Create Event theme selector). Keep the lowest id so the picker lists each theme once, and so
 * both the picker and Browse Event Themes agree on which row is canonical.
 */
export function dedupeThemesByName<T extends { id: number; name: string | null }>(themes: T[]): T[] {
  const byKey = new Map<string, T>();
  for (const theme of [...themes].sort((a, b) => a.id - b.id)) {
    const key = eventTypeNameKey(theme.name);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, theme);
  }
  return [...byKey.values()];
}

/**
 * Browse Event Themes shows one badge per directory category. Categories read from `event_types`
 * are authoritative; the `Themes Directory Catalog.tags` column is only a legacy label list, so
 * merge it in without producing a second badge for the same category.
 */
export function mergeThemeCategoryTags(dbTags: string[], categoryNames: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const name of [...categoryNames, ...dbTags]) {
    const label = String(name ?? "").trim();
    const key = eventTypeNameKey(label);
    if (!label || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}
