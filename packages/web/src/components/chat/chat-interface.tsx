"use client";

import { Fragment, useEffect, useRef, useState } from "react";
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
  Heart,
  Plus,
} from "lucide-react";
import { MarkdownBody } from "@/components/ui/markdown-body";
import { UpgradeModal } from "@/components/ui/upgrade-modal";
import { api } from "@/lib/api";
import { useChild } from "@/lib/contexts/child-context";

interface ChatInterfaceProps {
  childProfiles: ChildWithAge[];
  userId: string;
  subscriptionTier: string;
}

interface BirthUpdateSuggestion {
  child_name: string;
  dob: string; // ISO date or "unknown"
  detected_phrase: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  conversation_id?: string | null;
  cited_resources?: Array<{ id: string; title: string }>;
  is_saved?: boolean;
  birth_update_suggestion?: BirthUpdateSuggestion | null;
}

export function ChatInterface({
  childProfiles,
  userId,
  subscriptionTier,
}: ChatInterfaceProps) {
  const { selectedChildId: ctxChildId } = useChild();
  // Convert "all" context value to null for the API (null = no child filter)
  const chatChildId = ctxChildId === "all" ? null : ctxChildId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(
    null
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addedToDoctorList, setAddedToDoctorList] = useState<Set<number>>(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [dismissedBirthSuggestions, setDismissedBirthSuggestions] = useState<Set<number>>(new Set());
  const [confirmedBirths, setConfirmedBirths] = useState<Set<number>>(new Set());
  const [birthDobOverrides, setBirthDobOverrides] = useState<Record<number, string>>({});
  const [birthConfirmLoading, setBirthConfirmLoading] = useState<number | null>(null);

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
      setShowUpgradeModal(true);
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
        child_id: chatChildId,
      });

      if (status === 429) {
        setShowUpgradeModal(true);
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
        birth_update_suggestion?: BirthUpdateSuggestion | null;
      };

      // Add AI message with cited resources, conversation_id, and birth suggestion
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: responseData.content || responseData.message,
          conversation_id: responseData.conversation_id,
          cited_resources: responseData.cited_resources,
          is_saved: false,
          birth_update_suggestion: responseData.birth_update_suggestion ?? null,
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

    const childIds = chatChildId ? [chatChildId] : childProfiles.map((c) => c.id);

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

  const handleRecordBirth = async (msgIdx: number, suggestion: BirthUpdateSuggestion) => {
    const prenatalChildren = childProfiles.filter((c) => !c.is_born);
    const matchedChild =
      prenatalChildren.find(
        (c) => c.name.toLowerCase() === suggestion.child_name.toLowerCase()
      ) ?? (prenatalChildren.length === 1 ? prenatalChildren[0] : null);

    if (!matchedChild) return;

    const dobToUse =
      birthDobOverrides[msgIdx] ??
      (suggestion.dob !== "unknown" ? suggestion.dob : "");
    if (!dobToUse) return;

    setBirthConfirmLoading(msgIdx);
    const { error: apiError } = await api.children.markBorn(matchedChild.id, { dob: dobToUse });
    setBirthConfirmLoading(null);

    if (!apiError) {
      localStorage.setItem(`kinpath_birth_celebrated_${matchedChild.id}`, "chat");
      setConfirmedBirths((prev) => new Set(prev).add(msgIdx));
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
      {/* Header: New Chat + Saved link */}
      <div className="border-b border-stone-200/60 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-100"
            aria-label="Start a new chat"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Chat
          </button>
          <Link
            href="/chat/saved"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100"
          >
            <Archive className="h-4 w-4" />
            Saved
          </Link>
        </div>
      </div>

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
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 shadow-sm transition-colors duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-600 hover:shadow-card"
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
              <Fragment key={idx}>
              <div
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-lg ${msg.role === "user"
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
                          {msg.cited_resources.map((resource, rIdx) => (
                            <a
                              key={resource.id}
                              href={`/resources/${resource.id}`}
                              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700 hover:bg-brand-100"
                            >
                              <span className="font-semibold text-brand-500">[{rIdx + 1}]</span>
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
                          title={addedToDoctorList.has(idx) ? "Added to provider list" : "Discuss"}
                          className="group flex items-center gap-1 rounded-full px-2.5 py-1.5 text-stone-400 transition-colors hover:bg-brand-50 hover:text-brand-600 disabled:cursor-default"
                          aria-label={addedToDoctorList.has(idx) ? "Added to provider list" : "Discuss with provider"}
                        >
                          {addedToDoctorList.has(idx) ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Stethoscope className="h-4 w-4" />
                          )}
                          <span className="hidden text-xs font-medium group-hover:inline">
                            {addedToDoctorList.has(idx) ? "Added" : "Discuss"}
                          </span>
                        </button>
                        {msg.conversation_id && (
                          <button
                            onClick={() => handleSaveConversation(msg, idx)}
                            disabled={savingId === msg.conversation_id}
                            title={msg.is_saved ? "Unsave" : "Save"}
                            className="group flex items-center gap-1 rounded-full px-2.5 py-1.5 text-stone-400 transition-colors hover:bg-brand-50 hover:text-brand-600 disabled:cursor-default"
                            aria-label={msg.is_saved ? "Unsave conversation" : "Save conversation"}
                          >
                            {msg.is_saved ? (
                              <BookmarkCheck className="h-4 w-4 text-brand-500" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                            <span className="hidden text-xs font-medium group-hover:inline">
                              {msg.is_saved ? "Saved" : "Save"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Birth update suggestion card */}
              {msg.role === "assistant" &&
                msg.birth_update_suggestion &&
                !dismissedBirthSuggestions.has(idx) && (
                  <div className="flex justify-start mt-2">
                    <div className="max-w-lg w-full rounded-2xl rounded-bl-md border border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-sm">
                      {confirmedBirths.has(idx) ? (
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-[#C4956A] flex-shrink-0" fill="currentColor" />
                          <p className="text-sm font-medium text-stone-800">
                            Birth recorded! Visit your dashboard to see the updated experience.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4 text-[#C4956A] flex-shrink-0 mt-0.5" />
                              <p className="text-sm font-medium text-stone-800">
                                It sounds like {msg.birth_update_suggestion.child_name} has arrived! Would you like to record the birth?
                              </p>
                            </div>
                            <button
                              onClick={() => setDismissedBirthSuggestions((prev) => new Set(prev).add(idx))}
                              className="text-stone-400 hover:text-stone-600 flex-shrink-0"
                            >
                              ×
                            </button>
                          </div>
                          {msg.birth_update_suggestion.dob === "unknown" ? (
                            <input
                              type="date"
                              max={new Date().toISOString().split("T")[0]}
                              value={birthDobOverrides[idx] ?? ""}
                              onChange={(e) =>
                                setBirthDobOverrides((prev) => ({ ...prev, [idx]: e.target.value }))
                              }
                              className="mb-3 w-full rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-sm focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A]"
                            />
                          ) : (
                            <p className="mb-3 text-xs text-stone-500">
                              Birth date:{" "}
                              <span className="font-medium text-stone-700">
                                {new Date(msg.birth_update_suggestion.dob).toLocaleDateString()}
                              </span>
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRecordBirth(idx, msg.birth_update_suggestion!)}
                              disabled={
                                birthConfirmLoading === idx ||
                                (msg.birth_update_suggestion.dob === "unknown" && !birthDobOverrides[idx])
                              }
                              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C4956A] to-[#b8845c] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-[#b8845c] hover:to-[#a87550] transition-all disabled:opacity-50"
                            >
                              {birthConfirmLoading === idx ? "Recording..." : "Record birth"}
                            </button>
                            <button
                              onClick={() => setDismissedBirthSuggestions((prev) => new Set(prev).add(idx))}
                              className="rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-white/60 transition-colors"
                            >
                              Not now
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Fragment>
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
        <div aria-live="polite" className="mx-6 mb-4 flex items-start gap-3 rounded-lg border border-red-200/60 bg-red-50 px-4 py-3">
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
              aria-label="Ask a question"
              name="message"
              placeholder="Ask about parenting, sleep, nutrition…"
              disabled={loading}
              rows={1}
              className="flex-1 resize-none rounded-2xl border border-stone-200/60 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-500 shadow-sm transition-colors disabled:bg-stone-50 disabled:text-stone-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              aria-label={loading ? "Sending…" : "Send message"}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-sm transition-colors duration-150 disabled:bg-stone-300 hover:enabled:bg-brand-600"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Last free question nudge */}
          {subscriptionTier === "free" && remainingQuestions === 1 && (
            <div className="rounded-lg border border-amber-200/60 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Last free question this month.{" "}
              <Link href="/pricing" className="font-medium underline">
                Upgrade for unlimited
              </Link>
            </div>
          )}

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

          {/* AI disclaimer */}
          <p className="text-center text-[11px] leading-tight text-stone-400">
            Kinpath chat uses AI and can make mistakes. Always consult your healthcare provider for medical advice.
          </p>
        </div>
      </div>

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
