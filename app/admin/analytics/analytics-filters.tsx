"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

export function AnalyticsFilters({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [fromVal, setFromVal] = useState(from);
  const [toVal, setToVal] = useState(to);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (fromVal) params.set("from", fromVal);
    if (toVal) params.set("to", toVal);
    router.push(`/admin/analytics?${params.toString()}`);
  }

  return (
    <form
      onSubmit={apply}
      className="mt-5 flex flex-wrap items-end gap-3 rounded-petal border border-stone bg-white p-4"
    >
      <div>
        <Label htmlFor="from">From</Label>
        <Input
          id="from"
          type="date"
          value={fromVal}
          onChange={(e) => setFromVal(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="to">To</Label>
        <Input
          id="to"
          type="date"
          value={toVal}
          onChange={(e) => setToVal(e.target.value)}
          className="mt-1"
        />
      </div>
      <Button type="submit">Apply</Button>
    </form>
  );
}
