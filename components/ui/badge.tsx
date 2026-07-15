type BadgeVariant = "sale" | "new" | "bestseller" | "muted";

const styles: Record<BadgeVariant, string> = {
  sale: "bg-burgundy text-ivory",
  new: "bg-sage text-ivory",
  bestseller: "bg-blush text-burgundy-deep",
  muted: "bg-stone text-ink/70",
};

export function Badge({
  variant = "muted",
  children,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
