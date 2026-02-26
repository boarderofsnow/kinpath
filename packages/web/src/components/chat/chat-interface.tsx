"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChildWithAge } from "@kinpath/shared";
import { createClient } from "@/lib/supabase/client";
import {
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Archive,
  Stethoscope,
  Check,
} from "lucide-react";
import { MarkdownBody } from "@/components/ui/markdown-body";
import { api } from "@/lib/api";

interface ChatInterfaceProps {
  childProfiles: ChildWithAge[];
  userId: string;
  subscriptionTier: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  conversation_id?: string | null;
  cited_resources?: Array<{ id: string; title: string }>;
  is_saved?: boolean;
}

export function ChatInterface({
  childProfiles,
  userId,
  subscriptionTier,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    childProfiles.length > 0 ? childProfiles[0].id : null
  );
  const [inputValue, setInputValue] = useState("");
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(
    null
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addedToDoctorList, setAddedToDoctorList] = useState<Set<number>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Fetch remaining questions for free tier
  useEffect(() => {
    if (subscriptionTier !== "free") return;

    const fetchRemainingQuestions = async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data, error } = await supabase
        .from("ai_conversations")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .gte("created_at", startOfMonth.toISOString());

      if (!error && data) {
        const used = data.length;
        setRemainingQuestions(Math.max(0, 5 - used));
      }
    };

    fetchRemainingQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, subscriptionTier]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = Math.min(textareaRef.current.scrollHeight, 96); // Max 4 rows (~24px each)
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    // Check free tier limit
    if (subscriptionTier === "free" && remainingQuestions === 0) {
      setError("You have reached your monthly question limit. Upgrade to continue.");
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue("");
    setError(null);

    // Add user message to state
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const { data, error: apiError, status } = await api.ai.chat({
        message: userMessage,
        child_id: selectedChildId,
      });

      if (status === 429) {
        setError("Rate limited. Please upgrade to ask more questions.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      if (apiError || !data) {
        throw new Error(apiError || "Failed to send message");
      }

      const responseData = data as {
        message: string;
        content?: string;
        conversation_id: string | null;
        cited_resources?: Array<{ id: string; title: string }>;
      };

      // Add AI message with cited resources and conversation_id
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: responseData.content || responseData.message,
          conversation_id: responseData.conversation_id,
          cited_resources: responseData.cited_resources,
          is_saved: false,
        },
      ]);

      // Update remaining questions if free tier
      if (subscriptionTier === "free") {
        setRemainingQuestions((prev) => (prev !== null ? prev - 1 : prev));
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      // Remove the user message since the request failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConversation = async (msg: Message, msgIdx: number) => {
    if (!msg.conversation_id || savingId) return;

    setSavingId(msg.conversation_id);
    try {
      if (msg.is_saved) {
        await api.chat.unsave({ conversation_id: msg.conversation_id });
        setMessages((prev) =>
          prev.map((m, i) => (i === msgIdx ? { ...m, is_saved: false } : m))
        );
      } else {
        await api.chat.save({ conversation_id: msg.conversation_id });
        setMessages((prev) =>
          prev.map((m, i) => (i === msgIdx ? { ...m, is_saved: true } : m))
        );
      }
    } catch {
      // Silently fail — not critical
    } finally {
      setSavingId(null);
    }
  };

  const handleAddToDoctorList = async (msg: Message, msgIdx: number) => {
    if (addedToDoctorList.has(msgIdx)) return;

    // Find the preceding user message to use as title
    let title = "Chat topic";
    for (let i = msgIdx - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        title = messages[i].content.slice(0, 120);
        break;
      }
    }

    const childIds = selectedChildId ? [selectedChildId] : childProfiles.map((c) => c.id);

    const { data, error: insertErr } = await supabase
      .from("doctor_discussion_items")
      .insert({
        user_id: userId,
        title,
        notes: msg.content.slice(0, 500),
        priority: "normal",
        conversation_id: msg.conversation_id ?? null,
        sort_order: 0,
      })
      .select()
      .single();

    if (data && !insertErr) {
      if (childIds.length > 0) {
        await supabase.from("doctor_item_children").insert(
          childIds.map((cid) => ({ doctor_item_id: data.id, child_id: cid }))
        );
      }
      setAddedToDoctorList((prev) => new Set(prev).add(msgIdx));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isEmpty = messages.length === 0;
  const charCount = inputValue.length;
  const showCharCount = charCount > 1600;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header with child selector and saved link */}
      {childProfiles.length > 0 && (
        <div className="border-b border-stone-200/60 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedChildId(null)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedChildId === null
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-white text-stone-700 shadow-sm hover:bg-brand-50"
                }`}
              >
                All Children
              </button>
              {childProfiles.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedChildId === child.id
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-white text-stone-700 shadow-sm hover:bg-brand-50"
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
            <Link
              href="/chat/saved"
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100"
            >
              <Archive className="h-4 w-4" />
              Saved
            </Link>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-[#f0eeec] px-6 py-6"
      >
        {isEmpty ? (
          // Empty state
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100">
                <MessageCircle className="h-8 w-8 text-brand-500" />
              </div>
              <p className="text-base font-medium text-stone-700">
                Ask me anything about parenting
              </p>
              <p className="mt-1 text-sm text-stone-500">
                I&apos;ll draw from our evidence-based resource library to help you.
              </p>
              {/* Suggested questions */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "How much sleep does my baby need?",
                  "When should I introduce solid foods?",
                  "Tips for managing teething pain",
                ].map((question) => (
                  <button
                    key={question}
                    onClick={() => {
                      setInputValue(question);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-600 hover:shadow-card"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-lg ${
                    msg.role === "user"
                      ? "rounded-2xl rounded-br-md bg-brand-500 px-4 py-3 text-white"
                      : "rounded-2xl rounded-bl-md border border-stone-200/60 bg-white px-4 py-3 shadow-card"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="text-sm leading-relaxed">
                      <MarkdownBody content={msg.content} compact />
                    </div>
                  )}
                  {msg.role === "assistant" && (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      {msg.cited_resources?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {msg.cited_resources.map((resource) => (
                            <a
                              key={resource.id}
                              href={`/resources?search=${encodeURIComponent(
                                resource.title
                              )}`}
                              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700 hover:bg-brand-100"
                            >
                              <Sparkles className="h-3 w-3" />
                              {resource.title}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div />
                      )}
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => handleAddToDoctorList(msg, idx)}
                          disabled={addedToDoctorList.has(idx)}
                          className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                          title={addedToDoctorList.has(idx) ? "Added to doctor list" : "Add to doctor list"}
                        >
                          {addedToDoctorList.has(idx) ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Stethoscope className="h-4 w-4" />
                          )}
                        </button>
                        {msg.conversation_id && (
                          <button
                            onClick={() => handleSaveConversation(msg, idx)}
                            disabled={savingId === msg.conversation_id}
                            className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                            title={msg.is_saved ? "Unsave conversation" : "Save conversation"}
                          >
                            {msg.is_saved ? (
                              <BookmarkCheck className="h-4 w-4 text-brand-500" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-stone-200/60 bg-white px-4 py-3 shadow-card">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-brand-400 animate-pulse-soft"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-6 mb-4 flex items-start gap-3 rounded-lg border border-red-200/60 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-stone-200/60 bg-white px-6 py-4 shadow-lg">
        <div className="space-y-2">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about parenting, sleep, nutrition..."
              disabled={loading}
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-stone-200/60 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-500 shadow-sm transition-colors disabled:bg-stone-50 disabled:text-stone-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-sm transition-all disabled:bg-stone-300 hover:enabled:bg-brand-600"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Character count and free tier info */}
          <div className="flex items-center justify-between text-xs text-stone-500">
            {showCharCount ? (
              <span>
                {charCount} / 2000 characters
              </span>
            ) : (
              <span />
            )}
            {subscriptionTier === "free" && remainingQuestions !== null && (
              <span className="text-stone-600">
                {remainingQuestions} questions remaining this month
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
