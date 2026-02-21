export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enrichChildWithAge } from "@kinpath/shared";
import type { HouseholdMember } from "@kinpath/shared";
import { AppNav } from "@/components/nav/app-nav";
import { SettingsForm } from "@/components/settings/settings-form";

interface SettingsPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await searchParams; // await the promise

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user profile
  const { data: userProfile } = await supabase
    .from("users")
    .select("id, display_name, email, subscription_tier, stripe_customer_id")
    .eq("id", user.id)
    .single();

  // Fetch children
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const enrichedChildren = (children ?? []).map((child) =>
    enrichChildWithAge(child)
  );

  // Fetch user preferences
  const { data: preferences } = await supabase
    .from("user_preferences")
    .select(
      "birth_preference, feeding_preference, vaccine_stance, religion, dietary_preference, parenting_style, topics_of_interest"
    )
    .eq("user_id", user.id)
    .single();

  // Fetch notification preferences
  const { data: notificationPrefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch household members (family tier only)
  let householdMembers: HouseholdMember[] = [];
  if (userProfile?.subscription_tier === "family") {
    const { data: household } = await supabase
      .from("households")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (household) {
      const { data: members } = await supabase
        .from("household_members")
        .select("*")
        .eq("household_id", household.id)
        .order("invited_at", { ascending: true });

      householdMembers = (members as HouseholdMember[]) ?? [];
    }
  }

  return (
    <>
      <AppNav currentPath="/settings" />
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <SettingsForm
          user={userProfile}
          childProfiles={enrichedChildren}
          preferences={preferences}
          notificationPrefs={notificationPrefs}
          householdMembers={householdMembers}
        />
      </div>
    </>
  );
}
