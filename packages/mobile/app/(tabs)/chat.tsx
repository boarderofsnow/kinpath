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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
});

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

  const renderMessageBubble = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";

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
          <Text
            style={[
              styles.messageText,
              isUser
                ? styles.messageTextUser
                : styles.messageTextAssistant,
            ]}
          >
            {item.content}
          </Text>

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
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="chatbubble-outline" size={56} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyStateText}>Ask KinPath AI</Text>
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
              placeholder="Ask KinPath AI..."
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
