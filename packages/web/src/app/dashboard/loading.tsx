import { AppNav } from "@/components/nav/app-nav";

export default function DashboardLoading() {
  return (
    <>
      <AppNav currentPath="/dashboard" />
      <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
        {/* Header skeleton */}
        <header>
          <div className="h-7 w-64 rounded bg-stone-200" />
          <div className="mt-2 h-4 w-48 rounded bg-stone-200" />
        </header>

        {/* Search bar skeleton */}
        <div className="mt-6 max-w-md">
          <div className="h-10 w-full rounded-xl bg-stone-200" />
        </div>

        {/* Dashboard card skeleton */}
        <section className="mt-8">
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <div className="h-5 w-40 rounded bg-stone-200" />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="h-24 rounded-xl bg-stone-100" />
              <div className="h-24 rounded-xl bg-stone-100" />
            </div>
            <div className="mt-4 h-32 rounded-xl bg-stone-100" />
          </div>
        </section>

        {/* Resource feed skeleton */}
        <section className="mt-8">
          <div className="h-5 w-36 rounded bg-stone-200" />
          <div className="mt-2 h-4 w-72 rounded bg-stone-200" />
          <div className="mt-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-white p-5 shadow-card">
                <div className="h-4 w-3/4 rounded bg-stone-200" />
                <div className="mt-2 h-3 w-full rounded bg-stone-100" />
                <div className="mt-1 h-3 w-2/3 rounded bg-stone-100" />
              </div>
            ))}
          </div>
        </section>

        {/* AI CTA skeleton */}
        <section className="mt-12 rounded-2xl bg-sage-50 p-6">
          <div className="h-5 w-40 rounded bg-sage-200" />
          <div className="mt-2 h-3 w-64 rounded bg-sage-200" />
          <div className="mt-4 h-9 w-32 rounded-xl bg-sage-200" />
        </section>
      </div>
    </>
  );
}
