export interface SavedConversation {
  id: string;
  user_id: string;
  conversation_id: string;
  title: string | null;
  notes: string | null;
  created_at: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationWithMessages extends SavedConversation {
  ai_conversations: {
    messages: ConversationMessage[];
    cited_resource_ids: string[];
    child_id: string | null;
  };
}
