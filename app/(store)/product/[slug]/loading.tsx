export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="h-4 w-56 animate-pulse rounded bg-stone/60" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="aspect-[4/5] animate-pulse rounded-petal bg-stone/50" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded bg-stone/60" />
          <div className="h-6 w-32 animate-pulse rounded bg-stone/60" />
          <div className="h-24 animate-pulse rounded bg-stone/50" />
          <div className="h-12 animate-pulse rounded-lg bg-stone/60" />
        </div>
      </div>
    </div>
  );
}
