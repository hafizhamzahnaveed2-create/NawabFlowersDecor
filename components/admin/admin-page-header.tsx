import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export function AdminPageHeader({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-3xl tracking-tight text-burgundy">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink/60 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {actionHref && actionLabel ? (
          <Link href={actionHref} className={buttonClasses("primary", "md")}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
