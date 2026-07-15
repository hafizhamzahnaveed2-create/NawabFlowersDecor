// All prices are stored as Decimal in Postgres and handled as plain numbers
// (rupees) in application code. PKR has no commonly used sub-unit.

const formatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number | string): string {
  return formatter.format(Number(amount));
}
