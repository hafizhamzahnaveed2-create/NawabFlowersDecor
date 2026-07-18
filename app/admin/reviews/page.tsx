import Link from "next/link";
import { listPendingReviews } from "@/lib/repositories/reviews";
import { ReviewModerationActions } from "./review-actions";
import { requirePagePermission } from "../require-page-permission";

export const metadata = { title: "Reviews · Admin" };

export default async function AdminReviewsPage() {
  await requirePagePermission("reviews.moderate");
  const reviews = await listPendingReviews();

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="font-display text-3xl text-burgundy">Reviews</h1>
        <p className="mt-1 text-ink/60">
          Approve customer reviews before they appear on product pages.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="mt-8 rounded-petal border border-stone bg-white p-12 text-center">
          <p className="font-display text-2xl text-burgundy">All clear</p>
          <p className="mt-2 text-ink/60">No reviews waiting for moderation.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-petal border border-stone bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-burgundy">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </p>
                  <p className="mt-1 text-sm text-ink/70">
                    {r.user.name ?? r.user.email} on{" "}
                    <Link
                      href={`/product/${r.product.slug}`}
                      className="font-medium text-sage hover:text-burgundy"
                    >
                      {r.product.name}
                    </Link>
                  </p>
                  {r.title && (
                    <p className="mt-2 font-medium">{r.title}</p>
                  )}
                  {r.body && (
                    <p className="mt-1 text-ink/75">{r.body}</p>
                  )}
                </div>
                <ReviewModerationActions id={r.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
