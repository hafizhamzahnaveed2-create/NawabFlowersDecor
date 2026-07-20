import Image from "next/image";
import { SITE_LOGO, SITE_NAME } from "@/lib/brand";

/** Stable target for the welcome splash logo flight (`#site-brand-logo`). */
export function SiteLogo({
  size = 44,
  showName = true,
  nameClassName = "font-display text-xl text-burgundy sm:text-2xl",
  className = "",
  priority = false,
}: {
  size?: number;
  showName?: boolean;
  nameClassName?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        id="site-brand-logo"
        className="inline-flex shrink-0 transition-opacity duration-200"
      >
        <Image
          src={SITE_LOGO}
          alt={SITE_NAME}
          width={size}
          height={size}
          priority={priority}
          sizes={`${size}px`}
          className="rounded-full object-cover ring-1 ring-stone/80"
        />
      </span>
      {showName && <span className={nameClassName}>{SITE_NAME}</span>}
    </span>
  );
}
