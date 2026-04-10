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

const HW_KEYS = ["peaceful", "spiritual", "rejuvenating", "holistic"] as const;
export type HealthWellnessKey = (typeof HW_KEYS)[number];

export type HealthWellnessGroupsResult = {
  groups: Record<HealthWellnessKey, { id: number; name: string }[]>;
  /** DB parent row id for each sub-heading (Peaceful, Spiritual, …) — for Create Event type/subType. */
  parentIds: Partial<Record<HealthWellnessKey, number>>;
};

export async function loadHealthWellnessEventTypeGroups(): Promise<HealthWellnessGroupsResult> {
  const groups: HealthWellnessGroupsResult["groups"] = {
    peaceful: [],
    spiritual: [],
    rejuvenating: [],
    holistic: [],
  };
  const parentIds: Partial<Record<HealthWellnessKey, number>> = {};

  const labels = ["Peaceful", "Spiritual", "Rejuvenating", "Holistic"] as const;

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

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const key = HW_KEYS[i];
      const lower = label.toLowerCase();
      let parent =
        root != null
          ? rows.find((r) => (r.name ?? "").toLowerCase() === lower && r.parent_id === root.id)
          : undefined;
      if (!parent) {
        parent = rows.find((r) => (r.name ?? "").toLowerCase() === lower);
      }
      if (parent) {
        parentIds[key] = parent.id;
        groups[key] = childrenOf(parent.id);
      }
    }
  }

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const key = HW_KEYS[i];
    if (groups[key].length > 0) continue;
    const { data: legacyParent } = await supabase
      .from("event_types")
      .select("id")
      .eq("name", label)
      .eq("parent_id", 16)
      .eq("theme_id", 8)
      .maybeSingle();
    if (legacyParent?.id) {
      parentIds[key] = legacyParent.id;
      const { data: legacyKids } = await supabase
        .from("event_types")
        .select("id, name")
        .eq("parent_id", legacyParent.id)
        .order("name");
      groups[key] = (legacyKids ?? []).map((k) => ({ id: k.id, name: k.name ?? "" }));
    }
  }

  return { groups, parentIds };
}

export type RetreatsGroupsResult = {
  /** Branch label (top-level row under Retreats) → concrete event types */
  typesByBranch: Record<string, { id: number; name: string }[]>;
  /** Branch label → DB id of that branch row (parent of types in typesByBranch) */
  rootIdByBranch: Record<string, number>;
};

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
    if (!label) continue;
    rootIdByBranch[label] = root.id;
    typesByBranch[label] = rows
      .filter((r) => r.parent_id === root.id)
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
      .map((k) => ({ id: k.id, name: k.name ?? "" }));
  }
  return { typesByBranch, rootIdByBranch };
}
