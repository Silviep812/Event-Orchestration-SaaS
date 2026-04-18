/**
 * One-line summary for Create/Manage Event when a Sporting leaf is chosen.
 * If the DB used a single self-referential row (category name === type name), show once — not "X > X".
 */
export function sportingSelectionTrailLabel(categoryKey: string, leafDisplayName: string): string {
  const cat = sportingTypeUiLabel(categoryKey) || String(categoryKey).trim();
  const leaf = String(leafDisplayName ?? "").trim();
  if (!leaf) return cat;
  if (leaf.toLowerCase() === cat.toLowerCase()) return cat;
  return `${cat} > ${leaf}`;
}

/** Remove level qualifiers so Sporting type labels match other theme sizing/style (V5). */
export function sportingTypeUiLabel(name: string | null | undefined): string {
  let s = String(name ?? "").trim();
  if (!s) return "";
  // V5: explicit "(HS, college & pro)" / "high school, college and pro" blocks (DB or legacy copy).
  s = s.replace(/\(\s*hs\s*,\s*college\s*(?:&|and)\s*pro\s*\)/gi, "");
  s = s.replace(/\(\s*high\s*school\s*,\s*college\s*(?:&|and)\s*(?:pro|professional)\s*\)/gi, "");
  s = s.replace(/\(\s*hs\s*,\s*college\s*,\s*pro\s*\)/gi, "");
  // Any parenthetical whose content mentions level tiers (covers minor punctuation variants).
  s = s.replace(/\([^)]*(?:hs|high\s*school)[^)]*(?:college|university)[^)]*(?:pro|professional)[^)]*\)/gi, "");
  return s
    .replace(/\s*[-–]\s*(?:hs|high school|college|pro|professional)(?:\s*,\s*(?:hs|high school|college|pro|professional))*/gi, "")
    .replace(/\((?:hs|high school|college|pro|professional)[^)]*\)/gi, "")
    .replace(/\b(?:hs|high school|college|pro|professional)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/^\s*,\s*|\s*,\s*$/g, "")
    .trim();
}
