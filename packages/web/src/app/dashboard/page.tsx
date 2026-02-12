import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enrichChildWithAge } from "@kinpath/shared";
import { PregnancyDashboard } from "@/components/onboarding/pregnancy-dashboard";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Check if onboarding is complete
  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_complete")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  // Fetch children
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const enrichedChildren = (children ?? []).map((child) =>
    enrichChildWithAge(child)
  );

  // For now, use the first child's age for feed filtering
  const activeChild = enrichedChildren[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back
          </h1>
          {activeChild && (
            <p className="mt-1 text-sm text-gray-600">
              {activeChild.name} — {activeChild.age_label}
            </p>
          )}
        </div>
        <nav className="flex items-center gap-4">
          <a
            href="/settings"
            className="text-sm font-medium text-gray-600 hover:text-brand-600"
          >
            Settings
          </a>
        </nav>
      </header>

      {/* Child tabs (if multiple) */}
      {enrichedChildren.length > 1 && (
        <div className="mt-6 flex gap-2">
          {enrichedChildren.map((child) => (
            <button
              key={child.id}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-brand-50"
            >
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* Pregnancy Dashboard (for expecting parents) */}
      {activeChild && !activeChild.is_born && (
        <section className="mt-8">
          <PregnancyDashboard child={activeChild} />
        </section>
      )}

      {/* Feed placeholder */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Your Resources
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Age-appropriate resources will appear here based on{" "}
          {activeChild?.name ?? "your child"}&apos;s age and your preferences.
        </p>

        {/* Placeholder cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-3 h-3 w-full rounded bg-gray-100" />
              <div className="mt-2 h-3 w-5/6 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </section>

      {/* AI Assistant CTA */}
      <section className="mt-12 rounded-xl bg-sage-50 p-6">
        <h3 className="font-semibold text-sage-800">
          Have a question?
        </h3>
        <p className="mt-1 text-sm text-sage-600">
          Ask our AI assistant anything about parenting, nutrition, sleep, and
          more. Answers are grounded in our professionally-vetted resource library.
        </p>
        <button className="mt-4 rounded-lg bg-sage-500 px-4 py-2 text-sm font-medium text-white hover:bg-sage-600 transition-colors">
          Ask a Question
        </button>
      </section>
    </div>
  );
}
