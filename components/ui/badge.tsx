type BadgeVariant =
  | "sale"
  | "new"
  | "bestseller"
  | "muted"
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivery"
  | "delivered"
  | "cancelled"
  | "success"
  | "warning";

const styles: Record<BadgeVariant, string> = {
  sale: "bg-burgundy text-ivory",
  new: "bg-sage text-ivory",
  bestseller: "bg-blush text-burgundy-deep",
  muted: "bg-stone/80 text-ink/70",
  pending: "bg-blush/35 text-burgundy-deep",
  confirmed: "bg-sage/20 text-sage",
  preparing: "bg-stone text-ink/75",
  delivery: "bg-burgundy/10 text-burgundy",
  delivered: "bg-sage text-ivory",
  cancelled: "bg-ink/10 text-ink/55",
  success: "bg-sage/15 text-sage",
  warning: "bg-blush/40 text-burgundy-deep",
};

export function Badge({
  variant = "muted",
  children,
  className = "",
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

const orderStatusToBadge: Record<string, BadgeVariant> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  OUT_FOR_DELIVERY: "delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export function orderStatusBadgeVariant(status: string): BadgeVariant {
  return orderStatusToBadge[status] ?? "muted";
}
