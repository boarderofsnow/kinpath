export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enrichChildWithAge } from "@kinpath/shared";
import { AppNav } from "@/components/nav/app-nav";
import { SettingsForm } from "@/components/settings/settings-form";

interface SettingsPageProps {
  searchParams: Promise<{}>;
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
    .select("id, display_name, email")
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

  return (
    <>
      <AppNav currentPath="/settings" />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <SettingsForm
          user={userProfile}
          childProfiles={enrichedChildren}
          preferences={preferences}
        />
      </div>
    </>
  );
}
