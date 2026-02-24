import { AppNav } from "@/components/nav/app-nav";

export default function PlanLoading() {
  return (
    <>
      <AppNav currentPath="/plan" />
      <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
        {/* Header with child tabs and tab switcher */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 rounded bg-stone-200" />
            <div className="mt-2 h-4 w-48 rounded bg-stone-200" />
          </div>
        </div>

        {/* Child tabs skeleton */}
        <div className="mt-4 flex gap-2">
          <div className="h-8 w-20 rounded-full bg-brand-200" />
          <div className="h-8 w-20 rounded-full bg-stone-100" />
        </div>

        {/* Checklist / Doctor tab switcher skeleton */}
        <div className="mt-6 flex gap-1 rounded-lg bg-stone-100 p-1">
          <div className="h-9 flex-1 rounded-md bg-white shadow-sm" />
          <div className="h-9 flex-1 rounded-md bg-transparent" />
        </div>

        {/* List items skeleton */}
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card"
            >
              <div className="h-5 w-5 shrink-0 rounded border-2 border-stone-200" />
              <div className="flex-1">
                <div className="h-4 w-3/4 rounded bg-stone-200" />
                <div className="mt-1.5 h-3 w-1/2 rounded bg-stone-100" />
              </div>
              <div className="h-6 w-16 rounded-full bg-stone-100" />
            </div>
          ))}
        </div>

        {/* Add button skeleton */}
        <div className="mt-4 flex justify-center">
          <div className="h-10 w-36 rounded-xl bg-stone-200" />
        </div>
      </div>
    </>
  );
}
