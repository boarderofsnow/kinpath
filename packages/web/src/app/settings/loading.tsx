import { AppNav } from "@/components/nav/app-nav";

export default function SettingsLoading() {
  return (
    <>
      <AppNav currentPath="/settings" />
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 animate-pulse">
        {/* Profile section skeleton */}
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <div className="h-5 w-24 rounded bg-stone-200" />
          <div className="mt-4 space-y-4">
            <div>
              <div className="h-3 w-24 rounded bg-stone-200" />
              <div className="mt-1.5 h-10 w-full rounded-lg bg-stone-100" />
            </div>
            <div>
              <div className="h-3 w-16 rounded bg-stone-200" />
              <div className="mt-1.5 h-10 w-full rounded-lg bg-stone-100" />
            </div>
          </div>
        </section>

        {/* Children section skeleton */}
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 rounded bg-stone-200" />
            <div className="h-8 w-24 rounded-lg bg-stone-100" />
          </div>
          <div className="mt-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-stone-100 p-4">
                <div>
                  <div className="h-4 w-32 rounded bg-stone-200" />
                  <div className="mt-1 h-3 w-48 rounded bg-stone-100" />
                </div>
                <div className="h-8 w-16 rounded-lg bg-stone-100" />
              </div>
            ))}
          </div>
        </section>

        {/* Preferences section skeleton */}
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <div className="h-5 w-32 rounded bg-stone-200" />
          <div className="mt-4 grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-3 w-28 rounded bg-stone-200" />
                <div className="mt-1.5 h-10 w-full rounded-lg bg-stone-100" />
              </div>
            ))}
          </div>
        </section>

        {/* Subscription section skeleton */}
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <div className="h-5 w-28 rounded bg-stone-200" />
          <div className="mt-4 flex items-center justify-between">
            <div className="h-4 w-40 rounded bg-stone-100" />
            <div className="h-9 w-32 rounded-lg bg-stone-200" />
          </div>
        </section>
      </div>
    </>
  );
}
