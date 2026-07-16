"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ReviewModerationActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function moderate(isApproved: boolean) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isApproved }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={() => moderate(true)}
      >
        Approve
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() => moderate(false)}
      >
        Dismiss
      </Button>
    </div>
  );
}
