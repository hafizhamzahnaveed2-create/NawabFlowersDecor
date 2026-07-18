import { listCoupons } from "@/lib/repositories/coupons";
import { formatPrice } from "@/lib/money";
import { CouponCreateForm } from "./coupon-form";
import { CouponRowActions } from "./coupon-actions";
import { requirePagePermission } from "../require-page-permission";

export const metadata = { title: "Coupons · Admin" };

export default async function AdminCouponsPage() {
  await requirePagePermission("coupons.write");
  const coupons = await listCoupons();

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="font-display text-3xl text-burgundy">Coupons</h1>
        <p className="mt-1 text-ink/60">
          Promo codes applied at checkout. Redemptions update automatically.
        </p>
      </div>

      <CouponCreateForm />

      <div className="mt-8 overflow-hidden rounded-petal border border-stone bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone text-left text-xs uppercase tracking-wider text-ink/50">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Min order</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/50">
                  No coupons yet — create one above.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-ivory/60">
                  <td className="px-4 py-3 font-medium">{c.code}</td>
                  <td className="px-4 py-3">
                    {c.kind === "PERCENT"
                      ? `${c.value}%`
                      : formatPrice(c.value)}
                  </td>
                  <td className="px-4 py-3">
                    {c.minOrderAmount != null
                      ? formatPrice(c.minOrderAmount)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {c.redemptionCount}
                    {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    {c.isActive ? (
                      <span className="text-sage">Active</span>
                    ) : (
                      <span className="text-ink/40">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CouponRowActions id={c.id} isActive={c.isActive} coupon={c} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
