import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import {
  listPendingReviews,
  setReviewApproval,
} from "@/lib/repositories/reviews";

export async function GET() {
  const session = await requirePermission("reviews.moderate");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reviews = await listPendingReviews();
  return NextResponse.json({ reviews });
}

export async function PATCH(request: Request) {
  const session = await requirePermission("reviews.moderate");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const isApproved = body?.isApproved === true;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await setReviewApproval(id, isApproved, session.user.id);
  return NextResponse.json({ ok: true });
}
