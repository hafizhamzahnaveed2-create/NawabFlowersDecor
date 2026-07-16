"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("ok");
      setEmail("");
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email for newsletter"
        className="mt-0 flex-1"
      />
      <Button type="submit" disabled={busy} className="shrink-0">
        {busy ? "…" : "Subscribe"}
      </Button>
      {status === "ok" && (
        <p className="text-sm text-sage sm:basis-full">You&apos;re on the list.</p>
      )}
      {status === "error" && (
        <p className="text-sm text-burgundy sm:basis-full">
          Couldn&apos;t subscribe — check the address and try again.
        </p>
      )}
    </form>
  );
}
