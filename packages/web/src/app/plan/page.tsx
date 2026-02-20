export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enrichChildWithAge } from "@kinpath/shared";
import { AppNav } from "@/components/nav/app-nav";
import { PlanClient } from "@/components/plan/plan-client";

interface PlanPageProps {
  searchParams: Promise<{ child?: string }>;
}

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Check onboarding
  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_complete, display_name, subscription_tier")
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

  if (enrichedChildren.length === 0) {
    return (
      <>
        <AppNav currentPath="/plan" />
        <div className="mx-auto max-w-4xl px-4 py-12 text-center">
          <p className="text-stone-500">
            Add a child in{" "}
            <Link href="/settings" className="text-brand-600 underline">
              Settings
            </Link>{" "}
            to start planning.
          </p>
        </div>
      </>
    );
  }

  // Determine active child
  const activeChild = params.child
    ? enrichedChildren.find((c) => c.id === params.child) ?? enrichedChildren[0]
    : enrichedChildren[0];

  // Fetch checklist items for active child
  const { data: checklistItems } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("child_id", activeChild.id)
    .order("sort_order", { ascending: true });

  return (
    <>
      <AppNav currentPath="/plan" />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <PlanClient
          userId={user.id}
          children={enrichedChildren}
          activeChildId={activeChild.id}
          initialItems={checklistItems ?? []}
        />
      </div>
    </>
  );
}
