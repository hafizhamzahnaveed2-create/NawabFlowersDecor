export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="h-4 w-40 animate-pulse rounded bg-stone/60" />
      <div className="mt-4 h-10 w-64 animate-pulse rounded bg-stone/60" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <div className="h-72 animate-pulse rounded-petal bg-stone/50" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/6] animate-pulse rounded-petal bg-stone/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
