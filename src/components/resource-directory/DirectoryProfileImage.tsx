import { ImageIcon } from "lucide-react";
import { useState } from "react";

type DirectoryProfileImageProps = {
  profile: object;
  name: string;
  className?: string;
};

function imageUrlFrom(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Some older directory records store a JSON array or a comma-separated list.
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return imageUrlFrom(parsed);
    } catch {
      // A normal URL is expected here.
    }
    const candidate = trimmed.split(",").map((item) => item.trim()).find(Boolean);
    if (!candidate) return null;
    try {
      const url = new URL(candidate);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch {
      return null;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = imageUrlFrom(item);
      if (url) return url;
    }
  }
  return null;
}

/**
 * Shows the normalized directory image first while retaining legacy venue and
 * inventory image fields during the data migration. Broken or absent images
 * intentionally degrade to a neutral, non-fictional placeholder.
 */
export function DirectoryProfileImage({ profile, name, className = "" }: DirectoryProfileImageProps) {
  const fields = profile as Record<string, unknown>;
  const src =
    imageUrlFrom(fields.profile_image_url) ??
    imageUrlFrom(fields.venue_images) ??
    imageUrlFrom(fields.inventory_images);

  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex aspect-[16/9] items-center justify-center rounded-md bg-muted text-muted-foreground ${className}`}
        aria-label={`${name} image unavailable`}
      >
        <ImageIcon className="h-8 w-8" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} profile`}
      className={`aspect-[16/9] w-full rounded-md object-cover bg-muted ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
