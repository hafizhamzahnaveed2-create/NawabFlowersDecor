// Sale-price logic shared by product listings, product pages, and checkout
// re-pricing. A sale price applies only when set and inside its date window.

type Saleable = {
  price: number;
  salePrice: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
};

export function isSaleActive(p: Saleable, now = new Date()): boolean {
  if (p.salePrice == null) return false;
  if (p.saleStartsAt && now < p.saleStartsAt) return false;
  if (p.saleEndsAt && now > p.saleEndsAt) return false;
  return true;
}

export function effectivePrice(p: Saleable, now = new Date()): number {
  return isSaleActive(p, now) ? (p.salePrice as number) : p.price;
}
