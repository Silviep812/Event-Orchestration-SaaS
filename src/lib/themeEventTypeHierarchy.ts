/**
 * Health & Wellness and Retreats hierarchies load from `event_types` for the resolved `event_themes` row.
 * Reference data is seeded in Supabase migrations (search migrations for "Health & Wellness", "Peaceful", "Retreats").
 * If Browse / Create Event show empty type lists, apply pending migrations and ensure `theme_id` on `event_types` matches `event_themes.id`.
 */
import { supabase } from "@/integrations/supabase/client";

export type EventTypeRowLite = { id: number; name: string | null; parent_id: number | null };

export function isHealthWellnessThemeName(name: string | null | undefined): boolean {
  const n = (name ?? "").toLowerCase();
  return /health/i.test(n) && /wellness/i.test(n);
}

export function isRetreatsThemeName(name: string | null | undefined): boolean {
  const t = (name ?? "").trim();
  return /^retreats?$/i.test(t) || /^retreat\b/i.test(t);
}

export async function resolveThemeId(
  matchers: ((name: string) => boolean)[],
  legacyFallback: number
): Promise<number> {
  const { data: themes } = await supabase.from("event_themes").select("id, name");
  if (themes?.length) {
    for (const m of matchers) {
      const t = themes.find((x) => m(x.name));
      if (t) return t.id;
    }
  }
  return legacyFallback;
}

async function childrenUnderNamedParent(
  themeId: number,
  parentName: string,
  rootHint?: RegExp
): Promise<{ id: number; name: string }[]> {
  const { data: allTypes } = await supabase
    .from("event_types")
    .select("id, name, parent_id")
    .eq("theme_id", themeId);
  const rows = (allTypes ?? []) as EventTypeRowLite[];
  const root =
    rootHint != null
      ? rows.find((r) => r.parent_id == null && rootHint.test(r.name ?? ""))
      : rows.find((r) => r.parent_id == null);
  const lower = parentName.toLowerCase();
  let parent =
    root != null
      ? rows.find((r) => (r.name ?? "").toLowerCase() === lower && r.parent_id === root.id)
      : undefined;
  if (!parent) {
    parent = rows.find((r) => (r.name ?? "").toLowerCase() === lower);
  }
  if (!parent) return [];
  return rows
    .filter((r) => r.parent_id === parent.id)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
    .map((k) => ({ id: k.id, name: k.name ?? "" }));
}

async function fetchChildrenLegacy(themeId: number, parentName: string): Promise<{ id: number; name: string }[]> {
  const { data: p } = await supabase
    .from("event_types")
    .select("id")
    .eq("name", parentName)
    .eq("theme_id", themeId)
    .maybeSingle();
  if (!p?.id) return [];
  const { data: list } = await supabase
    .from("event_types")
    .select("id, name")
    .eq("parent_id", p.id)
    .order("name");
  return (list ?? []).map((k) => ({ id: k.id, name: k.name ?? "" }));
}

export async function fetchThemedChildren(
  matchers: ((name: string) => boolean)[],
  legacyThemeId: number,
  parentName: string,
  rootHint?: RegExp
): Promise<{ id: number; name: string }[]> {
  const tid = await resolveThemeId(matchers, legacyThemeId);
  let kids = await childrenUnderNamedParent(tid, parentName, rootHint);
  if (kids.length === 0) kids = await childrenUnderNamedParent(legacyThemeId, parentName, rootHint);
  if (kids.length === 0) kids = await fetchChildrenLegacy(legacyThemeId, parentName);
  return kids;
}

export async function fetchMeetupTopLevelBranch(
  matchers: ((name: string) => boolean)[],
  legacyThemeId: number,
  branchName: string
): Promise<{ id: number; name: string }[]> {
  const tid = await resolveThemeId(matchers, legacyThemeId);
  for (const themeId of [tid, legacyThemeId]) {
    const { data: parent } = await supabase
      .from("event_types")
      .select("id")
      .eq("theme_id", themeId)
      .eq("name", branchName)
      .is("parent_id", null)
      .maybeSingle();
    if (parent?.id) {
      const { data: kids } = await supabase
        .from("event_types")
        .select("id, name")
        .eq("parent_id", parent.id)
        .order("name");
      return (kids ?? []).map((k) => ({ id: k.id, name: k.name ?? "" }));
    }
  }
  return [];
}

/** Slug for Health & Wellness category keys (stable across Create Event / Manage Event). */
export function healthWellnessCategorySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "category";
}

/** Preferred display order for Health & Wellness category rows (new + legacy labels). */
const HW_PARENT_ORDER: string[] = [
  "spa and nutrition",
  "rejuvenation",
  "mindful",
  "tai chi",
  "holistic principles",
  "peaceful",
  "spiritual",
  "rejuvenating",
  "holistic",
];

/** @deprecated Use string slugs from `loadHealthWellnessEventTypeGroups` */
export type HealthWellnessKey = string;

export type HealthWellnessGroupsResult = {
  groups: Record<string, { id: number; name: string }[]>;
  parentIds: Record<string, number>;
  /** Slugs in UI order */
  orderedCategoryKeys: string[];
  /** Human label for each slug */
  keyLabel: Record<string, string>;
};

export async function loadHealthWellnessEventTypeGroups(): Promise<HealthWellnessGroupsResult> {
  const groups: Record<string, { id: number; name: string }[]> = {};
  const parentIds: Record<string, number> = {};
  const keyLabel: Record<string, string> = {};

  const { data: themes } = await supabase.from("event_themes").select("id, name");
  const hwTheme =
    themes?.find((t) => /health/i.test(t.name) && /wellness/i.test(t.name)) ??
    themes?.find((t) => /health\s*&\s*wellness/i.test(t.name)) ??
    themes?.find((t) => /health|wellness/i.test(t.name));

  const hwThemeId = hwTheme?.id;

  if (hwThemeId != null) {
    const { data: allTypes } = await supabase
      .from("event_types")
      .select("id, name, parent_id")
      .eq("theme_id", hwThemeId);

    const rows = (allTypes ?? []) as EventTypeRowLite[];
    const childrenOf = (pid: number) =>
      rows
        .filter((r) => r.parent_id === pid)
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
        .map((k) => ({ id: k.id, name: k.name ?? "" }));

    const root =
      rows.find((r) => r.parent_id == null && /health|wellness/i.test(r.name ?? "")) ??
      rows.find((r) => r.parent_id == null) ??
      null;

    const parents =
      root != null
        ? rows.filter((r) => r.parent_id === root.id)
        : rows.filter((r) => r.parent_id == null);

    for (const p of parents) {
      const label = (p.name ?? "").trim();
      if (!label) continue;
      const slug = healthWellnessCategorySlug(label);
      if (parentIds[slug]) continue;
      parentIds[slug] = p.id;
      keyLabel[slug] = label;
      let kids = childrenOf(p.id);
      if (kids.length === 0) {
        kids = [{ id: p.id, name: label }];
      }
      groups[slug] = kids;
    }

    if (Object.keys(parentIds).length === 0) {
      const legacyLabels = ["Peaceful", "Spiritual", "Rejuvenating", "Holistic"] as const;
      const legacySlugs = ["peaceful", "spiritual", "rejuvenating", "holistic"] as const;
      for (let i = 0; i < legacyLabels.length; i++) {
        const label = legacyLabels[i];
        const slug = legacySlugs[i];
        const lower = label.toLowerCase();
        let parent =
          root != null
            ? rows.find((r) => (r.name ?? "").toLowerCase() === lower && r.parent_id === root.id)
            : undefined;
        if (!parent) parent = rows.find((r) => (r.name ?? "").toLowerCase() === lower);
        if (parent) {
          parentIds[slug] = parent.id;
          keyLabel[slug] = label;
          let kids = childrenOf(parent.id);
          if (kids.length === 0) kids = [{ id: parent.id, name: label }];
          groups[slug] = kids;
        }
      }
    }
  }

  const orderIndex = (nameLower: string) => {
    const i = HW_PARENT_ORDER.findIndex((x) => x === nameLower);
    return i >= 0 ? i : 999;
  };

  const orderedCategoryKeys = Object.keys(parentIds).sort((a, b) => {
    const la = (keyLabel[a] ?? a).toLowerCase();
    const lb = (keyLabel[b] ?? b).toLowerCase();
    const oa = orderIndex(la);
    const ob = orderIndex(lb);
    if (oa !== ob) return oa - ob;
    return la.localeCompare(lb);
  });

  return { groups, parentIds, orderedCategoryKeys, keyLabel };
}

export type RetreatsGroupsResult = {
  /** Branch label (top-level row under Retreats) → concrete event types */
  typesByBranch: Record<string, { id: number; name: string }[]>;
  /** Branch label → DB id of that branch row (parent of types in typesByBranch) */
  rootIdByBranch: Record<string, number>;
};

/** Labels that belong to Health & Wellness and must not appear under Retreats. */
const RETREATS_EXCLUDED_LABELS = ["wellness", "mindful", "rejuvenating", "holistic"];

function isExcludedFromRetreats(label: string): boolean {
  const lower = label.trim().toLowerCase();
  return RETREATS_EXCLUDED_LABELS.some(
    (ex) => lower === ex || lower.startsWith(ex) || lower.includes(ex)
  );
}

export async function loadRetreatsEventTypeGroups(): Promise<RetreatsGroupsResult> {
  const typesByBranch: Record<string, { id: number; name: string }[]> = {};
  const rootIdByBranch: Record<string, number> = {};
  const { data: themes } = await supabase.from("event_themes").select("id, name");
  const rTheme =
    themes?.find((t) => /^retreats?$/i.test((t.name ?? "").trim())) ??
    themes?.find((t) => /retreat/i.test(t.name ?? ""));
  if (!rTheme?.id) return { typesByBranch, rootIdByBranch };

  const { data: allTypes } = await supabase
    .from("event_types")
    .select("id, name, parent_id")
    .eq("theme_id", rTheme.id);

  const rows = (allTypes ?? []) as EventTypeRowLite[];
  const roots = rows.filter((r) => r.parent_id == null);
  for (const root of roots) {
    const label = (root.name ?? "").trim();
    if (!label || isExcludedFromRetreats(label)) continue;
    rootIdByBranch[label] = root.id;
    const kids = rows
      .filter((r) => r.parent_id === root.id)
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
      .map((k) => ({ id: k.id, name: k.name ?? "" }));
    typesByBranch[label] =
      kids.length > 0 ? kids : [{ id: root.id, name: root.name ?? label }];
  }
  return { typesByBranch, rootIdByBranch };
}

/** DB or UI label: Sport, Sports, or Sporting (V4 canonical display: Sporting). */
export function isSportThemeName(name: string | null | undefined): boolean {
  const trimmed = (name ?? "").trim();
  return /^sport$/i.test(trimmed) || /^sports$/i.test(trimmed) || /^sporting$/i.test(trimmed);
}

export const SPORTING_THEME_V4_DESCRIPTION =
  "Tournaments, games, races, and spectator events";

export function sportingUiName(rawName: string | null | undefined): string {
  return isSportThemeName(rawName) ? "Sporting" : String(rawName ?? "").trim();
}

export type ThemePickerRow = { id: number; name: string; premium?: boolean | null };

/**
 * If the database has more than one sport-themed row (e.g. legacy "Sport" + "Sporting"),
 * the Create Event picker would show two identical "Sporting" labels. Keep one canonical row.
 */
export function dedupeSportThemesForPicker(themes: ThemePickerRow[]): ThemePickerRow[] {
  const sportRows = themes.filter((t) => isSportThemeName(t.name));
  if (sportRows.length <= 1) return themes;
  const preferred =
    sportRows.find((t) => /^sporting$/i.test((t.name ?? "").trim())) ??
    [...sportRows].sort((a, b) => a.id - b.id)[0];
  const keepId = preferred.id;
  return themes.filter((t) => !isSportThemeName(t.name) || t.id === keepId);
}

export function filterSportishTags(tags: string[]): string[] {
  return tags.filter((x) => !/^(sport|sports|sporting)$/i.test(String(x).trim()));
}

/**
 * Under the Sporting theme, the top `event_types` row used to be named Sport/Sporting and
 * duplicated the theme label in Create Event. Show a neutral directory step label instead.
 */
export function sportThemeRootCategoryDisplayLabel(
  themeName: string | null | undefined,
  rootTypeName: string | null | undefined,
): string {
  const raw = String(rootTypeName ?? "").trim();
  if (!raw) return "";
  if (!isSportThemeName(themeName)) return raw;
  if (isSportThemeName(raw)) return "Event formats";
  return raw;
}

/** Load parent → children map for themes that use directory → category → type (e.g. Reunion, Special Event). */
export async function loadEventTypesByParentTag(themeId: number): Promise<Record<string, { id: number; name: string }[]>> {
  const { data: allTypes } = await supabase
    .from("event_types")
    .select("id, name, parent_id")
    .eq("theme_id", themeId);

  const rows = (allTypes ?? []) as EventTypeRowLite[];
  const parents = rows.filter((r) => r.parent_id == null);
  const out: Record<string, { id: number; name: string }[]> = {};

  for (const p of parents) {
    const tag = (p.name ?? "").trim();
    if (!tag) continue;
    const kids = rows
      .filter((r) => r.parent_id === p.id)
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
      .map((k) => ({ id: k.id, name: k.name ?? "" }));
    out[tag] = kids.length > 0 ? kids : [{ id: p.id, name: tag }];
  }
  return out;
}

/** Leaf event types for the Sporting theme (children under each top-level directory row). */
export async function loadSportingLeafEventTypes(): Promise<{ id: number; name: string }[]> {
  const { data: themes } = await supabase.from("event_themes").select("id, name");
  const sportTheme = themes?.find((t) => isSportThemeName(t.name));
  if (!sportTheme?.id) return [];
  const sm = await loadEventTypesByParentTag(sportTheme.id);
  const flat = Object.values(sm).flat();
  const seen = new Set<number>();
  return flat.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}
