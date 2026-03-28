import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enrichChildWithAge } from "@kinpath/shared";
import { AppNav } from "@/components/nav/app-nav";
import { ChildHydrator } from "@/components/nav/child-hydrator";
import { ChatInterface } from "@/components/chat/chat-interface";
import { getHouseholdContext } from "@/lib/household";

export default async function ChatPage() {
  // Fetch authenticated user
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    redirect("/auth/login");
  }

  // Parallel — household context + subscription tier
  const [{ effectiveOwnerId }, { data: userData, error: userError }] = await Promise.all([
    getHouseholdContext(user.id, supabase),
    supabase.from("users").select("subscription_tier").eq("id", user.id).single(),
  ]);

  if (userError) {
    console.error("Error fetching user subscription:", userError);
  }

  // Fetch children (needs effectiveOwnerId from household context)
  const { data: childrenData, error: childrenError } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", effectiveOwnerId)
    .order("created_at", { ascending: true });

  if (childrenError) {
    console.error("Error fetching children:", childrenError);
  }

  const children = (childrenData || []).map((child) =>
    enrichChildWithAge(child)
  );

  const subscriptionTier = userData?.subscription_tier || "free";

  return (
    <div className="flex h-screen flex-col bg-[#f0eeec]">
      <AppNav />
      <ChildHydrator children={children} />
      <ChatInterface
        childProfiles={children}
        userId={user.id}
        subscriptionTier={subscriptionTier}
      />
    </div>
  );
}
