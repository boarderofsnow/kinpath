import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { api } from "../../lib/api";
import { colors, fonts, typography, spacing, radii, shadows, cardBase } from "../../lib/theme";
import { FadeInUp, StaggerItem, PressableScale, PulsingDot } from "../../components/motion";
import { ChatSkeleton } from "../../components/skeleton";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  cited_resources?: Array<{ id: string; title: string }>;
}

interface Child {
  id: string;
  name: string;
}

interface MarkdownElement {
  type: "text" | "bold" | "bullet" | "number" | "citation" | "paragraph" | "h1" | "h2" | "h3";
  content: string;
  index?: number;
}

// ── Markdown Helpers ────────────────────────────────────────

const renderInlineMarkdown = (text: string, isUser: boolean): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*)|(\[\d+\])|([^\*\[\]]+)/g;
  let match;
  let currentIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      const boldContent = match[1].replace(/\*\*/g, "");
      elements.push(
        <Text
          key={currentIndex}
          style={[
            isUser ? markdownStyles.textUser : markdownStyles.textAssistant,
            markdownStyles.bold,
          ]}
        >
          {boldContent}
        </Text>
      );
    } else if (match[2]) {
      const citationNum = match[2].slice(1, -1);
      elements.push(
        <View key={currentIndex} style={markdownStyles.citationBadge}>
          <Text style={markdownStyles.citationText}>{citationNum}</Text>
        </View>
      );
    } else if (match[3]) {
      elements.push(
        <Text
          key={currentIndex}
          style={isUser ? markdownStyles.textUser : markdownStyles.textAssistant}
        >
          {match[3]}
        </Text>
      );
    }
    currentIndex++;
  }

  return elements.length > 0
    ? elements
    : [
        <Text
          key={0}
          style={isUser ? markdownStyles.textUser : markdownStyles.textAssistant}
        >
          {text}
        </Text>,
      ];
};

const renderMarkdown = (text: string): React.ReactNode => {
  const elements: MarkdownElement[] = [];
  const lines = text.split("\n");

  lines.forEach((line) => {
    if (line.trim() === "") return;

    // Headings: # ## ###
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const hType = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      elements.push({ type: hType as MarkdownElement["type"], content: headingMatch[2] });
      return;
    }

    const numberMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      elements.push({ type: "number", content: numberMatch[2], index: parseInt(numberMatch[1]) });
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      elements.push({ type: "bullet", content: bulletMatch[1] });
      return;
    }

    elements.push({ type: "paragraph", content: line });
  });

  return (
    <View style={markdownStyles.container}>
      {elements.map((el, idx) => {
        switch (el.type) {
          case "h1":
            return (
              <Text key={idx} style={markdownStyles.h1}>
                {renderInlineMarkdown(el.content, false)}
              </Text>
            );
          case "h2":
            return (
              <Text key={idx} style={markdownStyles.h2}>
                {renderInlineMarkdown(el.content, false)}
              </Text>
            );
          case "h3":
            return (
              <Text key={idx} style={markdownStyles.h3}>
                {renderInlineMarkdown(el.content, false)}
              </Text>
            );
          case "bullet":
            return (
              <View key={idx} style={markdownStyles.bulletRow}>
                <Text style={markdownStyles.bulletDot}>{"\u2022"}</Text>
                <Text style={{ flex: 1 }}>{renderInlineMarkdown(el.content, false)}</Text>
              </View>
            );
          case "number":
            return (
              <View key={idx} style={markdownStyles.numberRow}>
                <Text style={markdownStyles.numberLabel}>{el.index}.</Text>
                <Text style={{ flex: 1 }}>{renderInlineMarkdown(el.content, false)}</Text>
              </View>
            );
          default:
            return (
              <Text key={idx}>{renderInlineMarkdown(el.content, false)}</Text>
            );
        }
      })}
    </View>
  );
};

const markdownStyles = StyleSheet.create({
  container: { gap: 6 },
  textUser: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 20, color: colors.white },
  textAssistant: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.foreground },
  bold: { fontFamily: fonts.sansBold },
  h1: { fontFamily: fonts.sansBold, fontSize: 18, lineHeight: 24, color: colors.foreground, marginTop: 4 },
  h2: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 22, color: colors.foreground, marginTop: 4 },
  h3: { fontFamily: fonts.sansSemiBold, fontSize: 14, lineHeight: 20, color: colors.stone[700], marginTop: 2 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginLeft: spacing.sm, marginVertical: 2 },
  bulletDot: { fontFamily: fonts.sans, fontSize: 14, marginRight: spacing.sm, marginTop: 2, color: colors.brand[500] },
  numberRow: { flexDirection: "row", alignItems: "flex-start", marginLeft: spacing.sm, marginVertical: 2 },
  numberLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, marginRight: spacing.sm, minWidth: 20, color: colors.brand[600] },
  citationBadge: {
    backgroundColor: colors.brand[50],
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginHorizontal: 2,
  },
  citationText: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.brand[600] },
});

// ── Suggestions ─────────────────────────────────────────────

const SUGGESTIONS = [
  "What milestones should I expect?",
  "How do I establish a sleep routine?",
  "When should I introduce solid foods?",
  "How can I manage teething pain?",
];

// ── Main Component ──────────────────────────────────────────

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [addedMessageIds, setAddedMessageIds] = useState<Set<string>>(new Set());
  const [addingMessageId, setAddingMessageId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("children")
          .select("id, name")
          .eq("user_id", user.id);

        if (error) { setIsLoadingChildren(false); return; }
        if (data && data.length > 0) {
          setChildren(data);
          setSelectedChildId(data[0].id);
        }
        setIsLoadingChildren(false);
      } catch { setIsLoadingChildren(false); }
    };
    fetchChildren();
  }, [user?.id]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.ai.chat({
        message: userMessage.content,
        child_id: selectedChildId || undefined,
        conversation_id: conversationId || undefined,
      });

      if (response.error) { setError(response.error); setIsLoading(false); return; }

      const data = response.data as {
        message: string;
        conversation_id: string;
        cited_resources?: Array<{ id: string; title: string }>;
      };

      if (!data?.message) { setError("No response received"); setIsLoading(false); return; }

      setConversationId(data.conversation_id);

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: data.message,
        cited_resources: data.cited_resources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
      setIsSaved(false);

      setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
      setIsLoading(false);
    }
  };

  const handleSaveConversation = async () => {
    if (!conversationId || !user?.id) return;
    try {
      if (isSaved) {
        await api.chat.unsave({ conversation_id: conversationId });
        setIsSaved(false);
      } else {
        const title = messages[0]?.content.slice(0, 50) || "Conversation";
        await api.chat.save({ conversation_id: conversationId, title });
        setIsSaved(true);
      }
    } catch (err) { console.error("Error toggling save:", err); }
  };

  const handleAddToChecklist = async (messageId: string, content: string) => {
    if (!user?.id || !selectedChildId || addedMessageIds.has(messageId)) return;
    setAddingMessageId(messageId);
    try {
      const { error } = await supabase.from("checklist_items").insert([{
        user_id: user.id,
        child_id: selectedChildId,
        title: `Discuss: ${content.slice(0, 60)}`,
        description: content,
        item_type: "custom",
        is_completed: false,
        sort_order: 0,
      }]);
      if (error) { setAddingMessageId(null); return; }
      setAddedMessageIds((prev) => new Set(prev).add(messageId));
      setAddingMessageId(null);
    } catch { setAddingMessageId(null); }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setIsSaved(false);
    setError(null);
    setAddedMessageIds(new Set());
    setInputValue("");
  };

  // ── Render Helpers ──────────────────────────────────────

  const renderMessageBubble = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const isAddingThis = addingMessageId === item.id;
    const isAddedAlready = addedMessageIds.has(item.id);

    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          {isUser ? (
            <Text style={styles.userText}>{item.content}</Text>
          ) : (
            renderMarkdown(item.content)
          )}

          {/* Cited resources */}
          {!isUser && item.cited_resources && item.cited_resources.length > 0 && (
            <View style={styles.citedSection}>
              {item.cited_resources.map((resource) => (
                <PressableScale key={resource.id} style={styles.citedResource}>
                  <Ionicons name="sparkles" size={12} color={colors.brand[500]} />
                  <Text style={styles.citedResourceText} numberOfLines={1}>
                    {resource.title}
                  </Text>
                </PressableScale>
              ))}
            </View>
          )}

          {/* Action bar */}
          {!isUser && (
            <View style={styles.actionBar}>
              <PressableScale
                style={[
                  styles.actionButton,
                  (isAddingThis || isAddedAlready) && styles.actionButtonAdded,
                ]}
                onPress={() => handleAddToChecklist(item.id, item.content)}
                disabled={isAddedAlready}
              >
                <Ionicons
                  name="clipboard-outline"
                  size={13}
                  color={isAddingThis || isAddedAlready ? colors.sage[700] : colors.stone[500]}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    (isAddingThis || isAddedAlready) && styles.actionButtonAddedText,
                  ]}
                >
                  {isAddingThis ? "Adding..." : isAddedAlready ? "Added!" : "Add to checklist"}
                </Text>
              </PressableScale>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FadeInUp delay={100}>
        <View style={styles.emptyIconBg}>
          <Ionicons name="chatbubble-outline" size={48} color={colors.brand[400]} />
        </View>
      </FadeInUp>

      <FadeInUp delay={200}>
        <Text style={styles.emptyTitle}>Chat with KinPath</Text>
        <Text style={styles.emptySubtext}>
          Get personalized guidance and answers to your parenting questions.
        </Text>
      </FadeInUp>

      <View style={styles.suggestionsContainer}>
        {SUGGESTIONS.map((suggestion, idx) => (
          <StaggerItem key={idx} index={idx} staggerDelay={80}>
            <PressableScale
              style={styles.suggestionChip}
              onPress={() => setInputValue(suggestion)}
            >
              <Text style={styles.suggestionChipText}>{suggestion}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.brand[400]} />
            </PressableScale>
          </StaggerItem>
        ))}
      </View>
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={[styles.messageRow, styles.messageRowAssistant]}>
      <View style={[styles.bubble, styles.bubbleAssistant, { paddingVertical: 14 }]}>
        <View style={styles.typingRow}>
          <PulsingDot delay={0} color={colors.brand[400]} />
          <PulsingDot delay={200} color={colors.brand[400]} />
          <PulsingDot delay={400} color={colors.brand[400]} />
          <Text style={styles.typingText}>Thinking...</Text>
        </View>
      </View>
    </View>
  );

  if (isLoadingChildren) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ChatSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        {messages.length > 0 && (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isSaved ? "Saved" : "Current"} Conversation
            </Text>
            <View style={styles.headerButtons}>
              <PressableScale style={styles.headerBtn} onPress={handleSaveConversation}>
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color={isSaved ? colors.brand[500] : colors.foreground}
                />
              </PressableScale>
              <PressableScale style={styles.headerBtn} onPress={handleNewConversation}>
                <Ionicons name="add" size={22} color={colors.foreground} />
              </PressableScale>
            </View>
          </View>
        )}

        {/* Child Selector */}
        {children.length > 0 && (
          <View style={styles.childSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {children.map((child) => {
                const isActive = selectedChildId === child.id;
                return (
                  <PressableScale
                    key={child.id}
                    style={[styles.childPill, isActive && styles.childPillActive]}
                    onPress={() => setSelectedChildId(child.id)}
                  >
                    <Text style={[styles.childPillText, isActive && styles.childPillTextActive]}>
                      {child.name}
                    </Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Messages or Empty */}
        {messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageBubble}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
          />
        )}

        {/* Typing */}
        {isLoading && messages.length > 0 && (
          <View style={styles.messagesContent}>
            {renderTypingIndicator()}
          </View>
        )}

        {/* Input */}
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputField}
              placeholder="Ask a question..."
              placeholderTextColor={colors.stone[400]}
              value={inputValue}
              onChangeText={setInputValue}
              editable={!isLoading}
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
            <PressableScale
              style={[
                styles.sendButton,
                (!inputValue.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              <Ionicons name="send" size={18} color={colors.white} />
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    ...shadows.soft,
  },
  headerTitle: {
    ...typography.headingSmall,
    color: colors.foreground,
    flex: 1,
  },
  headerButtons: { flexDirection: "row", gap: spacing.sm },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    justifyContent: "center",
    alignItems: "center",
  },

  // Child selector
  childSelector: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.stone[200]}66`,
  },
  childPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.stone[200],
  },
  childPillActive: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  childPillText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.foreground,
  },
  childPillTextActive: {
    color: colors.white,
  },

  // Messages
  messagesContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  messageRowUser: { justifyContent: "flex-end" },
  messageRowAssistant: { justifyContent: "flex-start" },

  // Bubbles — match web exactly
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  bubbleUser: {
    backgroundColor: colors.brand[500],
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.stone[200]}99`,
    borderBottomLeftRadius: 4,
    ...shadows.soft,
  },
  userText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  },

  // Cited resources
  citedSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${colors.stone[200]}66`,
  },
  citedResource: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    gap: spacing.xs,
    paddingVertical: 2,
  },
  citedResourceText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.brand[600],
    flex: 1,
  },

  // Action bar
  actionBar: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${colors.stone[200]}66`,
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
  },
  actionButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.stone[500],
  },
  actionButtonAdded: {
    backgroundColor: colors.sage[50],
  },
  actionButtonAddedText: {
    color: colors.sage[700],
  },

  // Typing indicator
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typingText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.stone[400],
    marginLeft: spacing.xs,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing["2xl"],
  },
  emptyIconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.displaySmall,
    color: colors.foreground,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptySubtext: {
    ...typography.bodyMedium,
    color: colors.stone[500],
    textAlign: "center",
    marginBottom: spacing["3xl"],
  },
  suggestionsContainer: {
    width: "100%",
    gap: spacing.sm,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.stone[200]}99`,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    ...shadows.soft,
  },
  suggestionChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.foreground,
    flex: 1,
  },

  // Error
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: "#fca5a5",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radii.sm,
  },
  errorText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: "#991b1b",
  },

  // Input area
  inputArea: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === "ios" ? 100 : 88,
    backgroundColor: colors.white,
    ...shadows.soft,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  inputField: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.foreground,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.brand[500],
    justifyContent: "center",
    alignItems: "center",
    ...shadows.glow,
  },
  sendButtonDisabled: {
    backgroundColor: colors.stone[300],
    shadowOpacity: 0,
  },
});
