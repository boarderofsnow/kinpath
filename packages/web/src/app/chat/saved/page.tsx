import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/nav/app-nav";
import { SavedChatsList } from "@/components/chat/saved-chats-list";
import { getHouseholdContext } from "@/lib/household";

export default async function SavedChatsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect("/auth/login");

  const { effectiveOwnerId } = await getHouseholdContext(user.id, supabase);

  // Fetch saved conversations with their messages
  const { data: savedConversations } = await supabase
    .from("saved_conversations")
    .select(
      "id, conversation_id, title, notes, created_at, ai_conversations(messages, cited_resource_ids, child_id)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch children for name resolution (use owner's children for partners)
  const { data: children } = await supabase
    .from("children")
    .select("id, name")
    .eq("user_id", effectiveOwnerId);

  const childMap = Object.fromEntries(
    (children ?? []).map((c) => [c.id, c.name])
  );

  // Normalize the Supabase join result — ai_conversations may come as
  // a single object or array depending on how the relationship is inferred.
  const normalized = (savedConversations ?? []).map((row: any) => {
    const convo = Array.isArray(row.ai_conversations)
      ? row.ai_conversations[0] ?? null
      : row.ai_conversations ?? null;
    return {
      id: row.id as string,
      conversation_id: row.conversation_id as string,
      title: row.title as string | null,
      notes: row.notes as string | null,
      created_at: row.created_at as string,
      messages: (convo?.messages ?? []) as Array<{
        role: "user" | "assistant";
        content: string;
      }>,
      cited_resource_ids: (convo?.cited_resource_ids ?? []) as string[],
      child_id: (convo?.child_id ?? null) as string | null,
    };
  });

  return (
    <div className="flex h-screen flex-col bg-[#f0eeec]">
      <AppNav currentPath="/chat" />
      <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              Saved Conversations
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Your bookmarked chat conversations for easy reference.
            </p>
          </div>
          <Link
            href="/chat"
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600"
          >
            New Chat
          </Link>
        </div>

        <SavedChatsList conversations={normalized} childMap={childMap} />
      </div>
    </div>
  );
}
