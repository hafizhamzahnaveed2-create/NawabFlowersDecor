import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  addToWishlist,
  listWishlist,
  removeFromWishlist,
} from "@/lib/repositories/wishlist";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const items = await listWishlist(session.user.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  await addToWishlist(session.user.id, productId);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  await removeFromWishlist(session.user.id, productId);
  return NextResponse.json({ ok: true });
}
