/**
 * Stable dashboard URLs for directory “profiles” (Supabase row IDs).
 * Use query params so shared links open the right directory and optional scroll/highlight.
 */

export type DirectoryProfileKind =
  | "venue"
  | "hospitality"
  /** Equipment / vendor-service directory (`vendor` table) */
  | "vendor"
  | "supplier"
  | "service_vendor"
  /** `service_rental_buy` — deep-links via `rentalId` on vendor-service page */
  | "service_rental_buy"
  | "transportation"
  | "marketing_subscriber"
  | "entertainment";

const BASE: Record<DirectoryProfileKind, string> = {
  venue: "/dashboard/venue",
  hospitality: "/dashboard/hospitality",
  vendor: "/dashboard/vendor-service",
  supplier: "/dashboard/supplier",
  service_vendor: "/dashboard/service-vendor",
  service_rental_buy: "/dashboard/vendor-service",
  transportation: "/dashboard/transportation",
  marketing_subscriber: "/dashboard/marketing-campaign",
  entertainment: "/dashboard/entertainment",
};

/** DOM id for scroll-target / highlight (stable for each directory row). */
export function directoryProfileElementId(entityId: string): string {
  return `directory-profile-${entityId}`;
}

export function directoryProfileUrl(kind: DirectoryProfileKind, id: string): string {
  const base = BASE[kind];
  const q = new URLSearchParams();
  if (kind === "service_rental_buy") {
    q.set("rentalId", id);
  } else {
    q.set("profileId", id);
  }
  return `${base}?${q.toString()}`;
}
