import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { firstLetterFromDisplayName, hueFromString } from "@/lib/avatarInitials";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt?: string;
  /** Used for default avatar: first letter on a colored circle when `src` is empty. */
  displayName: string;
  className?: string;
  fallbackClassName?: string;
};

function hasProfilePhoto(src: string | null | undefined): boolean {
  const t = (src ?? "").trim();
  if (!t) return false;
  if (t === "null" || t === "undefined") return false;
  return true;
}

/**
 * With no profile photo: colored circle + first letter of display name (new accounts).
 * With photo: shows the uploaded image.
 */
export function AvatarWithBrandFallback({
  src,
  alt = "",
  displayName,
  className,
  fallbackClassName,
}: Props) {
  const showPhoto = hasProfilePhoto(src);
  const label = displayName.trim();
  const letter = firstLetterFromDisplayName(label);
  const hue = hueFromString(label || "user");

  return (
    <Avatar className={className}>
      {showPhoto ? <AvatarImage src={src!.trim()} alt={alt} className="object-cover" /> : null}
      <AvatarFallback
        className={cn(
          "rounded-full border border-border/40 text-white font-semibold shadow-sm",
          fallbackClassName
        )}
        style={{ backgroundColor: `hsl(${hue} 52% 42%)` }}
      >
        <span className="select-none leading-none tracking-tight">{letter}</span>
      </AvatarFallback>
    </Avatar>
  );
}
