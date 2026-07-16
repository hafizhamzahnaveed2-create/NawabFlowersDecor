"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string | Date;
  authorName: string;
};

export function ProductReviews({
  productId,
  reviews,
  summary,
}: {
  productId: string;
  reviews: Review[];
  summary: { average: number | null; count: number };
}) {
  const { status } = useSession();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit review");
      setMessage(data.message);
      setTitle("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-burgundy">Reviews</h2>
          <p className="mt-1 text-ink/60">
            {summary.count === 0
              ? "No reviews yet — be the first."
              : `${summary.average}★ average from ${summary.count} review${summary.count === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {reviews.length > 0 && (
        <ul className="mt-6 space-y-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-petal border border-stone bg-white px-5 py-4"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-burgundy">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
                <span className="text-ink/50">· {r.authorName}</span>
              </div>
              {r.title && (
                <p className="mt-1 font-medium">{r.title}</p>
              )}
              {r.body && (
                <p className="mt-1 text-ink/75">{r.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 max-w-lg rounded-petal border border-stone bg-white p-6">
        <h3 className="font-display text-xl text-ink">Write a review</h3>
        {status !== "authenticated" ? (
          <p className="mt-3 text-sm text-ink/60">
            <Link href="/login" className="font-medium text-sage hover:text-burgundy">
              Sign in
            </Link>{" "}
            to share your experience.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="rating">Rating</Label>
              <select
                id="rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="review-title">Title (optional)</Label>
              <Input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="review-body">Your review (optional)</Label>
              <Textarea
                id="review-body"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
              />
            </div>
            <FieldError message={error ?? undefined} />
            {message && <p className="text-sm text-sage">{message}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Submit review"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
