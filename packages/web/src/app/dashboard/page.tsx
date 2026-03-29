import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enrichChildWithAge } from "@kinpath/shared";
import type { ChecklistItem, MilestoneAchievement } from "@kinpath/shared";
import { AppNav } from "@/components/nav/app-nav";
import { ChildHydrator } from "@/components/nav/child-hydrator";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getHouseholdContext } from "@/lib/household";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect("/auth/login");

  // Step A: Parallel — profile + household context
  const [{ data: profile }, { effectiveOwnerId }] = await Promise.all([
    supabase
      .from("users")
      .select("onboarding_complete, display_name")
      .eq("id", user.id)
      .single(),
    getHouseholdContext(user.id, supabase),
  ]);

  if (!profile) {
    redirect("/auth/login");
  }

  if (!profile.onboarding_complete) {
    redirect("/onboarding");
  }

  // Step B: Fetch all children
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", effectiveOwnerId)
    .order("created_at", { ascending: true });

  const enrichedChildren = (children ?? []).map((child) =>
    enrichChildWithAge(child)
  );

  // Step C: Fetch all checklist items + milestone achievements in parallel
  const [{ data: rawItems }, { data: rawAchievements }] = await Promise.all([
    supabase
      .from("checklist_items")
      .select("*, checklist_item_children(child_id)")
      .eq("user_id", effectiveOwnerId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("milestone_achievements")
      .select("*")
      .eq("user_id", effectiveOwnerId),
  ]);

  const allChecklistItems: ChecklistItem[] = (rawItems ?? []).map((row: any) => {
    const junctionRows = row.checklist_item_children ?? [];
    const childIds = junctionRows.map((j: { child_id: string }) => j.child_id);
    const { checklist_item_children: _, ...item } = row;
    return { ...item, child_ids: childIds } as ChecklistItem;
  });

  const allAchievements: MilestoneAchievement[] = (rawAchievements ?? []) as MilestoneAchievement[];

  return (
    <>
      <AppNav />
      <ChildHydrator profiles={enrichedChildren} />
      <DashboardClient
        displayName={profile.display_name}
        enrichedChildren={enrichedChildren}
        allChecklistItems={allChecklistItems}
        allAchievements={allAchievements}
        userId={user.id}
      />
    </>
  );
}
