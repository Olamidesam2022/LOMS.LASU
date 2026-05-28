import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  to?: string;
  compact?: boolean;
  className?: string;
}

export function BrandLogo({ to, compact = false, className }: BrandLogoProps) {
  const content = (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="app-brand-mark h-9 w-9">
        <span aria-hidden="true" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block text-base font-extrabold leading-tight text-foreground">
            LASU Legal
          </span>
          <span className="block text-[11px] font-medium leading-tight text-muted-foreground">
            Case Management
          </span>
        </span>
      )}
    </span>
  );

  if (!to) return content;

  return (
    <Link to={to} className="inline-flex min-h-11 items-center">
      {content}
    </Link>
  );
}
