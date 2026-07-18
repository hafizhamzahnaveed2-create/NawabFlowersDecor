import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  className = "",
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`surface-panel-quiet soft-rise px-6 py-12 text-center sm:px-10 ${className}`}
    >
      <p className="font-display text-2xl text-burgundy">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/60">
          {description}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className={`${buttonClasses("primary", "md")} mt-6`}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
