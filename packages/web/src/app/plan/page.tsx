export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enrichChildWithAge } from "@kinpath/shared";
import type { ChecklistItem, DoctorDiscussionItem } from "@kinpath/shared";
import { AppNav } from "@/components/nav/app-nav";
import { PlanClient } from "@/components/plan/plan-client";

interface PlanPageProps {
  searchParams: Promise<{ child?: string; tab?: string }>;
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
  const { data: childrenData } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const enrichedChildren = (childrenData ?? []).map((child) =>
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

  // Fetch ALL checklist items for this user with child tags via junction table
  const { data: rawItems } = await supabase
    .from("checklist_items")
    .select("*, checklist_item_children(child_id)")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  // Normalize: extract child_ids from the junction table join
  const checklistItems: ChecklistItem[] = (rawItems ?? []).map((row: any) => {
    const junctionRows = row.checklist_item_children ?? [];
    const childIds = junctionRows.map((j: { child_id: string }) => j.child_id);
    const { checklist_item_children: _, ...item } = row;
    return { ...item, child_ids: childIds } as ChecklistItem;
  });

  // Fetch doctor discussion items with child tags
  const { data: rawDoctorItems } = await supabase
    .from("doctor_discussion_items")
    .select("*, doctor_item_children(child_id)")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  const doctorItems: DoctorDiscussionItem[] = (rawDoctorItems ?? []).map((row: any) => {
    const junctionRows = row.doctor_item_children ?? [];
    const childIds = junctionRows.map((j: { child_id: string }) => j.child_id);
    const { doctor_item_children: _, ...item } = row;
    return { ...item, child_ids: childIds } as DoctorDiscussionItem;
  });

  return (
    <>
      <AppNav currentPath="/plan" />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <PlanClient
          userId={user.id}
          childProfiles={enrichedChildren}
          activeChildId={activeChild.id}
          initialItems={checklistItems}
          initialDoctorItems={doctorItems}
          initialTab={(params.tab as "checklist" | "doctor") ?? "checklist"}
        />
      </div>
    </>
  );
}
