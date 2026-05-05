import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DirectoryProfileKind,
  directoryProfileUrl,
} from "@/lib/directoryProfileLinks";

/** In-app link to the matching directory profile URL (shareable, opens correct table + highlight). */
export function DirectoryProfileLink({
  kind,
  id,
  className,
  label = "Profile link",
}: {
  kind: DirectoryProfileKind;
  id: string;
  className?: string;
  label?: string;
}) {
  return (
    <Link
      to={directoryProfileUrl(kind, id)}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}
