export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enrichChildWithAge } from "@kinpath/shared";
import { AppNav } from "@/components/nav/app-nav";
import { ChatInterface } from "@/components/chat/chat-interface";
import { getHouseholdContext } from "@/lib/household";

export default async function ChatPage() {
  // Fetch authenticated user
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Resolve household context — partners use the owner's user_id for data queries.
  const { effectiveOwnerId } = await getHouseholdContext(user.id);

  // Fetch user's children (using effectiveOwnerId so partners see owner's children)
  const { data: childrenData, error: childrenError } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", effectiveOwnerId)
    .order("created_at", { ascending: true });

  if (childrenError) {
    console.error("Error fetching children:", childrenError);
  }

  // Enrich children with age
  const children = (childrenData || []).map((child) =>
    enrichChildWithAge(child)
  );

  // Fetch user's subscription tier
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if (userError) {
    console.error("Error fetching user subscription:", userError);
  }

  const subscriptionTier = userData?.subscription_tier || "free";

  return (
    <div className="flex h-screen flex-col bg-[#f0eeec]">
      <AppNav currentPath="/chat" />
      <ChatInterface
        childProfiles={children}
        userId={user.id}
        subscriptionTier={subscriptionTier}
      />
    </div>
  );
}
