

## Plan: Hide "Family" and "School" categories from Reunion theme

### Where the categories come from
`EventThemesDirectory.tsx` (line ~355) calls `loadEventTypesByParentTag(themeId)` for Reunion and Special Event. The returned `Record<categoryName, types[]>` is stored in `dynamicHierarchyByThemeId` and then turned into `dynamicTags` (line ~463) shown under the theme card and used for the Create Event flow.

So "Family" and "School" are top-level keys in that record for the Reunion theme.

### Fix (single file, mirrors the Retreats exclusion pattern already in the codebase)

**File: `src/lib/themeEventTypeHierarchy.ts`**

1. Add a constant + helper near the existing Retreats exclusion block:
   ```ts
   const REUNION_EXCLUDED_CATEGORIES = ["family", "school"];
   function isExcludedFromReunion(label: string): boolean {
     const l = label.trim().toLowerCase();
     return REUNION_EXCLUDED_CATEGORIES.some(
       (ex) => l === ex || l.startsWith(ex) || l.includes(ex)
     );
   }
   ```

2. Add a thin wrapper exported alongside `loadEventTypesByParentTag`:
   ```ts
   export async function loadReunionEventTypesByParentTag(themeId: number) {
     const map = await loadEventTypesByParentTag(themeId);
     const filtered: typeof map = {};
     for (const [tag, types] of Object.entries(map)) {
       if (!isExcludedFromReunion(tag)) filtered[tag] = types;
     }
     return filtered;
   }
   ```

**File: `src/components/themes/EventThemesDirectory.tsx`**

- Import `loadReunionEventTypesByParentTag`.
- In the loop (~line 355), branch on theme name:
  ```ts
  if (/reunion/i.test(n)) {
    next[t.id] = await loadReunionEventTypesByParentTag(t.id);
  } else if (/special event/i.test(n)) {
    next[t.id] = await loadEventTypesByParentTag(t.id);
  }
  ```

### Why this approach
- Surgical: only Reunion is filtered. Special Event keeps "Family"/"School" if present.
- Mirrors the existing Retreats exclusion pattern (consistent with codebase conventions).
- No database changes — categories remain in `event_types` for other consumers.

### Out of scope
The unrelated build errors listed in `<build-errors>` (TaskManager, Collaborate, Comments, edge functions, etc.) are pre-existing and not introduced by this change. They can be addressed separately.

