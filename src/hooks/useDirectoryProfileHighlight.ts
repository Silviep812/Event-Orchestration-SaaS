import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { directoryProfileElementId } from "@/lib/directoryProfileLinks";

/**
 * Reads `profileId` or `rentalId` from the URL and scrolls to the matching directory card when present.
 */
export function useDirectoryProfileHighlight(loading: boolean) {
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get("profileId");
  const rentalId = searchParams.get("rentalId");

  useEffect(() => {
    if (loading) return;
    const targetId = rentalId
      ? `directory-rental-${rentalId}`
      : profileId
        ? directoryProfileElementId(profileId)
        : null;
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [loading, profileId, rentalId]);

  const highlightClass = (entityId: string) =>
    profileId === entityId ? "ring-2 ring-primary shadow-md" : "";

  const rentalHighlightClass = (rid: string) =>
    rentalId === rid ? "ring-2 ring-primary shadow-md" : "";

  return { profileId, rentalId, highlightClass, rentalHighlightClass };
}
