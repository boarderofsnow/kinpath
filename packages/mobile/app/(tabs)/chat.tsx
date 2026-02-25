import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
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

const COLORS = {
  primary: "#10b89f",
  secondary: "#5f8253",
  accent: "#f59e0b",
  background: "#f0eeec",
  dark: "#1c1917",
  stone200: "#e7e5e4",
  white: "#ffffff",
};

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
  type: "text" | "bold" | "bullet" | "number" | "citation" | "paragraph";
  content: string;
  index?: number;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone200,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    flex: 1,
  },
  headerButtonGroup: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  childSelectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone200,
  },
  childPillsScroll: {
    display: "flex",
  },
  childPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: COLORS.stone200,
    borderWidth: 2,
    borderColor: COLORS.stone200,
  },
  childPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  childPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.dark,
  },
  childPillTextActive: {
    color: COLORS.white,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  suggestionsContainer: {
    flexDirection: "column",
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  suggestionChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.dark,
    lineHeight: 18,
  },
  messageContainer: {
    marginBottom: 12,
    display: "flex",
    flexDirection: "row",
  },
  messageContainerUser: {
    justifyContent: "flex-end",
  },
  messageContainerAssistant: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  messageBubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleAssistant: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextUser: {
    color: COLORS.white,
    fontWeight: "500",
  },
  messageTextAssistant: {
    color: COLORS.dark,
    fontWeight: "400",
  },
  boldText: {
    fontWeight: "700",
  },
  bulletPoint: {
    marginLeft: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  bulletPointText: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletDot: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 3,
  },
  numberPoint: {
    marginLeft: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  numberPointText: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  numberLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 8,
    minWidth: 20,
  },
  citationBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  citationText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: "700",
  },
  citedResourcesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  citedResourceLink: {
    marginBottom: 6,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  citedResourceText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
    marginLeft: 6,
    flex: 1,
  },
  actionBarContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.dark,
  },
  actionButtonAdded: {
    backgroundColor: "#d1fae5",
  },
  actionButtonAddedText: {
    color: "#065f46",
  },
  typingIndicatorContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.dark,
    marginHorizontal: 3,
    opacity: 0.6,
  },
  inputArea: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.stone200,
    backgroundColor: COLORS.white,
  },
  inputRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  inputField: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.dark,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.stone200,
  },
  errorMessage: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  errorMessageText: {
    fontSize: 13,
    color: "#991b1b",
    fontWeight: "500",
  },
  markdownContainer: {
    gap: 6,
  },
  paragraphSpacing: {
    height: 8,
  },
});

// Markdown rendering function
const renderMarkdown = (text: string): React.ReactNode => {
  const elements: MarkdownElement[] = [];
  const lines = text.split("\n");

  lines.forEach((line, lineIndex) => {
    if (line.trim() === "") {
      return;
    }

    // Check for numbered list
    const numberMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      elements.push({
        type: "number",
        content: numberMatch[2],
        index: parseInt(numberMatch[1]),
      });
      return;
    }

    // Check for bullet list
    const bulletMatch = line.match(/^-\s+(.+)$/);
    if (bulletMatch) {
      elements.push({
        type: "bullet",
        content: bulletMatch[1],
      });
      return;
    }

    // Regular paragraph - split by markdown patterns
    const parts = parseParagraph(line);
    elements.push({
      type: "paragraph",
      content: line,
    });
  });

  return (
    <View style={styles.markdownContainer}>
      {elements.map((element, index) => {
        switch (element.type) {
          case "bullet":
            return (
              <View key={index} style={styles.bulletPoint}>
                <View style={styles.bulletPointText}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={{ flex: 1 }}>
                    {renderInlineMarkdown(element.content)}
                  </Text>
                </View>
              </View>
            );
          case "number":
            return (
              <View key={index} style={styles.numberPoint}>
                <View style={styles.numberPointText}>
                  <Text style={styles.numberLabel}>{element.index}.</Text>
                  <Text style={{ flex: 1 }}>
                    {renderInlineMarkdown(element.content)}
                  </Text>
                </View>
              </View>
            );
          default:
            return (
              <Text key={index}>
                {renderInlineMarkdown(element.content)}
              </Text>
            );
        }
      })}
    </View>
  );
};

// Helper function to parse inline markdown patterns
const renderInlineMarkdown = (text: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  // Match bold (**text**), citations ([1], [2], etc), and regular text
  const pattern = /\*\*(.+?)\*\*|\[(\d+)\]|.+?(?=\*\*|\[|$)/g;
  let match;

  const regex = /(\*\*[^*]+\*\*)|(\[\d+\])|([^\*\[\]]+)/g;
  let currentIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      // Bold text
      const boldContent = match[1].replace(/\*\*/g, "");
      elements.push(
        <Text key={currentIndex} style={styles.boldText}>
          {boldContent}
        </Text>
      );
    } else if (match[2]) {
      // Citation badge [1], [2], etc
      const citationNum = match[2].slice(1, -1);
      elements.push(
        <View
          key={currentIndex}
          style={[styles.citationBadge, { marginHorizontal: 2 }]}
        >
          <Text style={styles.citationText}>{citationNum}</Text>
        </View>
      );
    } else if (match[3]) {
      // Regular text
      elements.push(
        <Text key={currentIndex}>{match[3]}</Text>
      );
    }
    currentIndex++;
  }

  return elements.length > 0
    ? elements
    : [<Text key={0}>{text}</Text>];
};

// Helper to split paragraph by pattern
const parseParagraph = (text: string): string[] => {
  return text.split(/(\*\*[^*]+\*\*|\[\d+\])/);
};

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
  const [addedMessageIds, setAddedMessageIds] = useState<Set<string>>(
    new Set()
  );
  const [addingMessageId, setAddingMessageId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const suggestions = [
    "What milestones should I expect?",
    "How do I establish a sleep routine?",
    "When should I introduce solid foods?",
    "How can I manage teething pain?",
  ];

  // Fetch children on mount
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("children")
          .select("id, name")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching children:", error);
          setIsLoadingChildren(false);
          return;
        }

        if (data && data.length > 0) {
          setChildren(data);
          setSelectedChildId(data[0].id);
        }
        setIsLoadingChildren(false);
      } catch (err) {
        console.error("Failed to fetch children:", err);
        setIsLoadingChildren(false);
      }
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

      if (response.error) {
        setError(response.error);
        setIsLoading(false);
        return;
      }

      const data = response.data as {
        message: string;
        conversation_id: string;
        cited_resources?: Array<{ id: string; title: string }>;
      };

      if (!data || !data.message) {
        setError("No response received from the server");
        setIsLoading(false);
        return;
      }

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

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to get response";
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleSaveConversation = async () => {
    if (!conversationId || !user?.id) return;

    try {
      if (isSaved) {
        // Unsave
        await api.chat.unsave({ conversation_id: conversationId });
        setIsSaved(false);
      } else {
        // Save
        const title = messages[0]?.content.slice(0, 50) || "Conversation";
        await api.chat.save({ conversation_id: conversationId, title });
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Error toggling conversation save:", err);
    }
  };

  const handleAddToChecklist = async (messageId: string, content: string) => {
    if (!user?.id || !selectedChildId || addedMessageIds.has(messageId)) {
      return;
    }

    setAddingMessageId(messageId);

    try {
      const { error } = await supabase.from("checklist_items").insert([
        {
          user_id: user.id,
          child_id: selectedChildId,
          title: `Discuss: ${content.slice(0, 60)}`,
          description: content,
          item_type: "custom",
          is_completed: false,
          sort_order: 0,
        },
      ]);

      if (error) {
        console.error("Error adding to checklist:", error);
        setAddingMessageId(null);
        return;
      }

      setAddedMessageIds((prev) => new Set(prev).add(messageId));
      setAddingMessageId(null);

      // Revert button text after 2 seconds
      setTimeout(() => {
        setAddingMessageId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to add to checklist:", err);
      setAddingMessageId(null);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setIsSaved(false);
    setError(null);
    setAddedMessageIds(new Set());
    setInputValue("");
  };

  const renderMessageBubble = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const isAddingThis = addingMessageId === item.id;
    const isAddedAlready = addedMessageIds.has(item.id);

    return (
      <View
        style={[
          styles.messageContainer,
          isUser
            ? styles.messageContainerUser
            : styles.messageContainerAssistant,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser
              ? styles.messageBubbleUser
              : styles.messageBubbleAssistant,
          ]}
        >
          {isUser ? (
            <Text
              style={[
                styles.messageText,
                styles.messageTextUser,
              ]}
            >
              {item.content}
            </Text>
          ) : (
            renderMarkdown(item.content)
          )}

          {!isUser && item.cited_resources && item.cited_resources.length > 0 && (
            <View style={styles.citedResourcesContainer}>
              {item.cited_resources.map((resource) => (
                <TouchableOpacity
                  key={resource.id}
                  style={styles.citedResourceLink}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="link"
                    size={12}
                    color={COLORS.primary}
                  />
                  <Text
                    style={styles.citedResourceText}
                    numberOfLines={1}
                  >
                    {resource.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!isUser && (
            <View style={styles.actionBarContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  (isAddingThis || isAddedAlready) && styles.actionButtonAdded,
                ]}
                onPress={() => handleAddToChecklist(item.id, item.content)}
                disabled={isAddedAlready}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="clipboard"
                  size={14}
                  color={isAddingThis || isAddedAlready ? "#065f46" : COLORS.dark}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    (isAddingThis || isAddedAlready) && styles.actionButtonAddedText,
                  ]}
                >
                  {isAddingThis ? "Adding..." : isAddedAlready ? "Added!" : "Add to checklist"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="chatbubble-outline" size={56} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyStateText}>Chat with KinPath</Text>
      <Text style={styles.emptyStateSubtext}>
        Get personalized guidance and answers to your parenting questions.
      </Text>
      <View style={styles.suggestionsContainer}>
        {suggestions.map((suggestion, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.suggestionChip}
            onPress={() => handleSuggestionPress(suggestion)}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionChipText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={styles.typingIndicatorContainer}>
      <View style={styles.messageBubble}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4 }}>
          <View style={[styles.typingDot, { opacity: 0.4 }]} />
          <View style={[styles.typingDot, { opacity: 0.7 }]} />
          <View style={[styles.typingDot, { opacity: 1.0 }]} />
          <Text style={{ fontSize: 13, color: "#999", marginLeft: 8 }}>Thinking...</Text>
        </View>
      </View>
    </View>
  );

  if (isLoadingChildren) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header with save and new conversation buttons */}
        {messages.length > 0 && (
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>
              {isSaved ? "Saved" : "Current"} Conversation
            </Text>
            <View style={styles.headerButtonGroup}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleSaveConversation}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={24}
                  color={isSaved ? COLORS.primary : COLORS.dark}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleNewConversation}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={COLORS.dark}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Child Selector */}
        {children.length > 0 && (
          <View style={styles.childSelectorContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.childPillsScroll}
            >
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childPill,
                    selectedChildId === child.id && styles.childPillActive,
                  ]}
                  onPress={() => setSelectedChildId(child.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.childPillText,
                      selectedChildId === child.id &&
                        styles.childPillTextActive,
                    ]}
                  >
                    {child.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorMessage}>
            <Text style={styles.errorMessageText}>{error}</Text>
          </View>
        )}

        {/* Messages List */}
        {messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageBubble}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            scrollEnabled={true}
            onEndReachedThreshold={0.1}
          />
        )}

        {/* Typing Indicator */}
        {isLoading && messages.length > 0 && (
          <View style={styles.messagesContent}>
            {renderTypingIndicator()}
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputField}
              placeholder="Ask a question..."
              placeholderTextColor="#999"
              value={inputValue}
              onChangeText={setInputValue}
              editable={!isLoading}
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputValue.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              activeOpacity={0.7}
            >
              <Ionicons
                name="send"
                size={20}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
