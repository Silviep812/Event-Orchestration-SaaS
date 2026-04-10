/** Open booking URL, website, or mailto — shared by Hospitality & Transportation directories. */

export function normalizeExternalUrl(raw: string | null | undefined): string {
  let t = (raw ?? "").trim();
  if (!t) return "";
  // Common bad data: single slash after scheme, missing slash, whitespace
  t = t.replace(/^https:\/(?!\/)/i, "https://").replace(/^http:\/(?!\/)/i, "http://");
  if (/^https?:\/\//i.test(t)) return t;
  if (/^mailto:/i.test(t)) return t;
  if (/^www\./i.test(t)) return `https://${t}`;
  if (/^[a-z0-9_-][\w.-]*\.[a-z]{2,}(\/.*)?$/i.test(t)) return `https://${t}`;
  return `https://${t}`;
}

export function openReservationUrl(
  raw: string | null | undefined,
  showToast: (opts: { title: string; description?: string; variant?: "destructive" }) => void,
  emailFallback?: string | null,
): void {
  const t = (raw ?? "").trim();
  const email = (emailFallback ?? "").trim();

  const openMail = (addr: string) => {
    window.location.href = `mailto:${addr}`;
  };

  if (!t) {
    if (email) {
      openMail(email);
      return;
    }
    showToast({
      title: "No reservation link",
      description: "This profile has no booking URL or email on file.",
      variant: "destructive",
    });
    return;
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
    openMail(t);
    return;
  }

  const href = normalizeExternalUrl(t);
  try {
    const u = new URL(href);
    if (u.protocol === "http:" || u.protocol === "https:") {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
  } catch {
    // fall through
  }

  if (email) {
    showToast({
      title: "Using email instead",
      description:
        "The saved reservation link was not a valid web URL. Opening your email client.",
    });
    openMail(email);
    return;
  }

  showToast({
    title: "Invalid reservation link",
    description:
      "The saved URL could not be opened. Ask the provider to fix the booking link or add an email.",
    variant: "destructive",
  });
}
