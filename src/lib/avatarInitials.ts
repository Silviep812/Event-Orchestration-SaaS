/** Single visible character for default avatar (first letter of display / user name). */
export function firstLetterFromDisplayName(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const ch = [...t][0];
  return ch ? ch.toLocaleUpperCase() : "?";
}

/** Stable hue from string so the same name keeps the same color. */
export function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}
