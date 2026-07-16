import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reviewSchema } from "@/lib/validation/growth";
import { submitReview } from "@/lib/repositories/reviews";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const review = await submitReview(session.user.id, {
    productId: parsed.data.productId,
    rating: parsed.data.rating,
    title: parsed.data.title || undefined,
    body: parsed.data.body || undefined,
  });
  return NextResponse.json(
    { review, message: "Thanks — your review will appear after we approve it." },
    { status: 201 },
  );
}
