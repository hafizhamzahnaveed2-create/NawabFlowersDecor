import { formatPrice } from "@/lib/money";

export function Price({
  price,
  salePrice,
  isSaleActive,
  className = "",
}: {
  price: number;
  salePrice: number | null;
  isSaleActive: boolean;
  className?: string;
}) {
  if (isSaleActive && salePrice != null) {
    return (
      <span className={`inline-flex items-baseline gap-2 ${className}`}>
        <span className="font-semibold text-burgundy">
          {formatPrice(salePrice)}
        </span>
        <s className="text-sm text-ink/50">{formatPrice(price)}</s>
      </span>
    );
  }
  return (
    <span className={`font-semibold text-ink ${className}`}>
      {formatPrice(price)}
    </span>
  );
}
