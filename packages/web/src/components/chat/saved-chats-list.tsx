"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  MessageCircle,
  User,
  Sparkles,
} from "lucide-react";
import { MarkdownBody } from "@/components/ui/markdown-body";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SavedConversationItem {
  id: string;
  conversation_id: string;
  title: string | null;
  notes: string | null;
  created_at: string;
  messages: ConversationMessage[];
  cited_resource_ids: string[];
  child_id: string | null;
}

interface SavedChatsListProps {
  conversations: SavedConversationItem[];
  childMap: Record<string, string>;
}

export function SavedChatsList({
  conversations,
  childMap,
}: SavedChatsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState(conversations);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (conversationId: string) => {
    setRemovingId(conversationId);
    try {
      const res = await fetch("/api/chat/save", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.filter((c) => c.conversation_id !== conversationId)
        );
      }
    } catch {
      // Silently fail
    } finally {
      setRemovingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-card">
        <MessageCircle className="mx-auto mb-4 h-12 w-12 text-stone-300" />
        <p className="text-stone-500">No saved conversations yet.</p>
        <p className="mt-1 text-sm text-stone-400">
          Bookmark helpful chat responses to save them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((conv) => {
        const isExpanded = expandedId === conv.id;
        const childName = conv.child_id ? childMap[conv.child_id] : null;
        const firstUserMsg = conv.messages.find((m) => m.role === "user");
        const date = new Date(conv.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <div
            key={conv.id}
            className="rounded-2xl border border-stone-200/60 bg-white shadow-card"
          >
            {/* Header — always visible */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : conv.id)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900">
                  {conv.title || "Untitled conversation"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-stone-400">
                  <span>{date}</span>
                  {childName && (
                    <>
                      <span className="text-stone-300">&middot;</span>
                      <span className="rounded-full bg-sage-100 px-1.5 py-0.5 text-sage-700">
                        {childName}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="ml-3 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(conv.conversation_id);
                  }}
                  disabled={removingId === conv.conversation_id}
                  className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Remove from saved"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-stone-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-stone-400" />
                )}
              </div>
            </button>

            {/* Preview when collapsed */}
            {!isExpanded && firstUserMsg && (
              <div className="border-t border-stone-100 px-5 py-3">
                <p className="truncate text-xs text-stone-500">
                  {firstUserMsg.content}
                </p>
              </div>
            )}

            {/* Expanded messages */}
            {isExpanded && conv.messages.length > 0 && (
              <div className="border-t border-stone-100 px-5 py-4">
                <div className="space-y-4">
                  {conv.messages.map((msg, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                          msg.role === "user"
                            ? "bg-brand-100 text-brand-600"
                            : "bg-sage-100 text-sage-600"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {msg.role === "user" ? (
                          <p className="text-sm text-stone-700">
                            {msg.content}
                          </p>
                        ) : (
                          <div className="text-sm text-stone-700">
                            <MarkdownBody content={msg.content} compact />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
