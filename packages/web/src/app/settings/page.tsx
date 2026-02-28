import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enrichChildWithAge } from "@kinpath/shared";
import type { HouseholdMember } from "@kinpath/shared";
import { AppNav } from "@/components/nav/app-nav";
import { SettingsForm } from "@/components/settings/settings-form";
import { getHouseholdContext } from "@/lib/household";

interface SettingsPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await searchParams; // await the promise

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/auth/login");
  }

  // Get household context first — determines whose children/preferences to show
  const { effectiveOwnerId, isPartner, householdId } =
    await getHouseholdContext(user.id, supabase);

  // Parallel queries — children and preferences use effectiveOwnerId (owner's data
  // for partners), while profile and notification prefs are always the user's own.
  const [
    { data: userProfile },
    { data: children },
    { data: preferences },
    { data: notificationPrefs },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, display_name, email, subscription_tier, stripe_customer_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("children")
      .select("*")
      .eq("user_id", effectiveOwnerId)
      .order("created_at", { ascending: true }),
    supabase
      .from("user_preferences")
      .select(
        "birth_preference, feeding_preference, vaccine_stance, religion, dietary_preference, parenting_style, topics_of_interest"
      )
      .eq("user_id", effectiveOwnerId)
      .single(),
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single(),
  ]);

  const enrichedChildren = (children ?? []).map((child) =>
    enrichChildWithAge(child)
  );

  // Fetch household members (family tier only, conditional)
  let householdMembers: HouseholdMember[] = [];
  if (userProfile?.subscription_tier === "family") {
    let resolvedHouseholdId: string | null = householdId;

    if (!resolvedHouseholdId) {
      const { data: household } = await supabase
        .from("households")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      resolvedHouseholdId = household?.id ?? null;
    }

    if (resolvedHouseholdId) {
      const { data: members } = await supabase
        .from("household_members")
        .select("*")
        .eq("household_id", resolvedHouseholdId)
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
          isPartner={isPartner}
        />
      </div>
    </>
  );
}
