import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import {
  calculateAgeInWeeks,
  formatAgeLabel,
  getDevelopmentStage,
} from "@kinpath/shared";
import type { Child, ChildWithAge } from "@kinpath/shared";
import type { ChecklistItem, User } from "@kinpath/shared";

const COLORS = {
  primary: "#10b89f",
  secondary: "#5f8253",
  accent: "#f59e0b",
  background: "#f0eeec",
  dark: "#1c1917",
  stone200: "#e7e5e4",
  lightGray: "#f9f9f9",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 24,
    lineHeight: 36,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 14,
    marginTop: 20,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    opacity: 0.6,
  },
  childCardContainer: {
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  childCardPrenatal: {
    borderLeftColor: COLORS.accent,
  },
  childCardContent: {
    padding: 16,
    paddingLeft: 14,
  },
  childHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  childAvatarPrenatal: {
    backgroundColor: COLORS.accent,
  },
  childAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
  },
  childHeaderText: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 4,
  },
  childAgeLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  childAgeLabelPrenatal: {
    color: COLORS.accent,
  },
  developmentStage: {
    fontSize: 13,
    color: "#999",
    marginBottom: 12,
    fontWeight: "500",
  },
  dueDateCountdown: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  dueDateText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "600",
    textAlign: "center",
  },
  upcomingChecklistContainer: {
    marginTop: 12,
    borderTopColor: COLORS.stone200,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  upcomingTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomColor: COLORS.stone200,
    borderBottomWidth: 1,
  },
  checklistItem_last: {
    borderBottomWidth: 0,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderColor: COLORS.primary,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkboxCheck: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  checklistItemText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    marginLeft: 10,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: COLORS.dark,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  addChildButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  addChildButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  quickActionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionButtonAskAI: {
    backgroundColor: COLORS.primary,
  },
  quickActionButtonBrowse: {
    backgroundColor: COLORS.secondary,
  },
  quickActionButtonAddChild: {
    backgroundColor: COLORS.accent,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 10,
    textAlign: "center",
  },
  quickActionTextActive: {
    color: COLORS.white,
  },
  quickActionIcon: {
    fontSize: 32,
  },
  quickActionIconActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

interface EnrichedChild extends ChildWithAge {
  age_in_weeks: number;
  age_label: string;
}

export default function HomeScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [userData, setUserData] = useState<User | null>(null);
  const [children, setChildren] = useState<EnrichedChild[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<Record<string, ChecklistItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch user data
      const { data: userRecord } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userRecord) {
        setUserData(userRecord);
      }

      // Fetch children
      const { data: childrenData } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (childrenData) {
        // Enrich children with age data
        const enrichedChildren: EnrichedChild[] = childrenData.map((child: Child) => {
          const ageInWeeks = calculateAgeInWeeks(child);
          return {
            ...child,
            age_in_weeks: ageInWeeks,
            age_label: formatAgeLabel(ageInWeeks),
          };
        });

        setChildren(enrichedChildren);

        // Fetch upcoming checklist items for each child
        if (enrichedChildren.length > 0) {
          const childIds = enrichedChildren.map((c) => c.id);

          const { data: checklistData } = await supabase
            .from("checklist_items")
            .select("*")
            .in("child_id", childIds)
            .eq("is_completed", false)
            .order("due_date", { ascending: true })
            .limit(30); // Get more to ensure we have 3+ per child

          if (checklistData) {
            // Group by child_id and take next 3 for each
            const groupedItems: Record<string, ChecklistItem[]> = {};
            childIds.forEach((id) => {
              groupedItems[id] = (checklistData as ChecklistItem[])
                .filter((item) => item.child_id === id)
                .slice(0, 3);
            });
            setUpcomingItems(groupedItems);
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [user?.id, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const calculateDaysUntilDue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateWeeksRemaining = (dueDate: string): number => {
    const days = calculateDaysUntilDue(dueDate);
    return Math.ceil(days / 7);
  };

  const formatDueDate = (dueDate: string): string => {
    const weeks = calculateWeeksRemaining(dueDate);
    if (weeks < 0) return "Due soon";
    if (weeks === 0) return "This week";
    if (weeks === 1) return "1 week to go";
    return `${weeks} weeks to go`;
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning";
    } else if (hour < 18) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  };

  const displayName = userData?.display_name || user?.email?.split("@")[0] || "Parent";
  const greeting = `${getGreeting()}, ${displayName}`;

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <Text style={styles.greeting}>{greeting}</Text>

        {children.length === 0 ? (
          <View>
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="people-outline" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyStateText}>Welcome to KinPath!</Text>
              <Text style={styles.emptyStateSubtext}>
                Start by adding your child to get personalized guidance, track milestones,
                and access expert resources.
              </Text>
              <TouchableOpacity
                style={styles.addChildButton}
                onPress={() => router.push("/settings")}
              >
                <Text style={styles.addChildButtonText}>Add Your First Child</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={[styles.quickActionButton, styles.quickActionButtonAskAI]}
                onPress={() => router.push("/(tabs)/chat")}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={32}
                  color={COLORS.white}
                  style={styles.quickActionIcon}
                />
                <Text style={[styles.quickActionText, styles.quickActionTextActive]}>
                  Ask AI
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionButton, styles.quickActionButtonBrowse]}
                onPress={() => router.push("/(tabs)/browse")}
              >
                <Ionicons
                  name="book-outline"
                  size={32}
                  color={COLORS.white}
                  style={styles.quickActionIcon}
                />
                <Text style={[styles.quickActionText, styles.quickActionTextActive]}>
                  Browse
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your Children</Text>
            {children.map((child) => {
              const isPrenatal = child.age_in_weeks < 0;
              const childInitial = child.name.charAt(0).toUpperCase();
              const upcomingForChild = upcomingItems[child.id] || [];
              const lastIndex = upcomingForChild.length - 1;

              return (
                <View
                  key={child.id}
                  style={[
                    styles.childCardContainer,
                    isPrenatal && styles.childCardPrenatal,
                  ]}
                >
                  <View style={styles.childCardContent}>
                    <View style={styles.childHeader}>
                      <View
                        style={[
                          styles.childAvatar,
                          isPrenatal && styles.childAvatarPrenatal,
                        ]}
                      >
                        <Text style={styles.childAvatarText}>{childInitial}</Text>
                      </View>
                      <View style={styles.childHeaderText}>
                        <Text style={styles.childName}>{child.name}</Text>
                        <Text
                          style={[
                            styles.childAgeLabel,
                            isPrenatal && styles.childAgeLabelPrenatal,
                          ]}
                        >
                          {child.age_label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.developmentStage}>
                      {getDevelopmentStage(child.age_in_weeks)}
                    </Text>

                    {isPrenatal && child.due_date && (
                      <View style={styles.dueDateCountdown}>
                        <Text style={styles.dueDateText}>
                          {formatDueDate(child.due_date)}
                        </Text>
                      </View>
                    )}

                    {upcomingForChild.length > 0 && (
                      <View style={styles.upcomingChecklistContainer}>
                        <Text style={styles.upcomingTitle}>Upcoming checklist</Text>
                        {upcomingForChild.map((item, index) => (
                          <View
                            key={item.id}
                            style={[
                              styles.checklistItem,
                              index === lastIndex && styles.checklistItem_last,
                            ]}
                          >
                            <View
                              style={[
                                styles.checkbox,
                                item.is_completed && styles.checkboxChecked,
                              ]}
                            >
                              {item.is_completed && (
                                <Text style={styles.checkboxCheck}>✓</Text>
                              )}
                            </View>
                            <Text style={styles.checklistItemText} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color={COLORS.stone200}
                            />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={[styles.quickActionButton, styles.quickActionButtonAskAI]}
                onPress={() => router.push("/(tabs)/chat")}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={32}
                  color={COLORS.white}
                  style={styles.quickActionIcon}
                />
                <Text style={[styles.quickActionText, styles.quickActionTextActive]}>
                  Ask AI
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionButton, styles.quickActionButtonBrowse]}
                onPress={() => router.push("/(tabs)/browse")}
              >
                <Ionicons
                  name="book-outline"
                  size={32}
                  color={COLORS.white}
                  style={styles.quickActionIcon}
                />
                <Text style={[styles.quickActionText, styles.quickActionTextActive]}>
                  Browse
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionButton, styles.quickActionButtonAddChild]}
                onPress={() => router.push("/settings")}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={32}
                  color={COLORS.white}
                  style={styles.quickActionIcon}
                />
                <Text style={[styles.quickActionText, styles.quickActionTextActive]}>
                  Add Child
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
