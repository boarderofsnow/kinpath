"use client";

import { useEffect, useRef, useState } from "react";
import { ChildWithAge } from "@kinpath/shared";
import { createClient } from "@/lib/supabase/client";
import {
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface ChatInterfaceProps {
  childProfiles: ChildWithAge[];
  userId: string;
  subscriptionTier: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  cited_resources?: Array<{ id: string; title: string }>;
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
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          child_id: selectedChildId,
        }),
      });

      if (response.status === 429) {
        setError("Rate limited. Please upgrade to ask more questions.");
        setMessages((prev) =>
          prev.slice(0, -1) // Remove the user message we just added
        );
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();

      // Add AI message with cited resources
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content || data.message,
          cited_resources: data.cited_resources,
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
      {/* Header with child selector */}
      {childProfiles.length > 0 && (
        <div className="border-b border-stone-200/60 bg-white px-6 py-4 shadow-sm">
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
              <MessageCircle className="mx-auto mb-4 h-12 w-12 text-stone-400" />
              <p className="text-base text-stone-600">
                Ask me anything about parenting, nutrition, sleep, and more.
              </p>
              <p className="text-sm text-stone-500">
                I&apos;ll draw from our evidence-based resource library to help you.
              </p>
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
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.role === "assistant" && msg.cited_resources?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
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
                  ) : null}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-stone-200/60 bg-white px-4 py-3 shadow-card">
                  <div className="flex gap-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-stone-400"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-stone-400"
                      style={{ animationDelay: "0.4s" }}
                    />
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
