import { AppNav } from "@/components/nav/app-nav";

export default function ResourcesLoading() {
  return (
    <>
      <AppNav currentPath="/resources" />
      <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
        {/* Header skeleton */}
        <div>
          <div className="h-7 w-48 rounded bg-stone-200" />
          <div className="mt-2 h-4 w-80 rounded bg-stone-200" />
        </div>

        {/* Search bar skeleton */}
        <div className="mt-6 max-w-xl">
          <div className="h-10 w-full rounded-xl bg-stone-200" />
        </div>

        {/* Topic filter tabs skeleton */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`h-8 rounded-full ${i === 1 ? "w-20 bg-brand-200" : "w-24 bg-stone-100"}`}
            />
          ))}
        </div>

        {/* Resource cards grid skeleton */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl bg-white p-5 shadow-card">
              <div className="h-4 w-3/4 rounded bg-stone-200" />
              <div className="mt-3 space-y-1.5">
                <div className="h-3 w-full rounded bg-stone-100" />
                <div className="h-3 w-5/6 rounded bg-stone-100" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-5 w-16 rounded-full bg-stone-100" />
                <div className="h-5 w-20 rounded-full bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
