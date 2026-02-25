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
import { ChevronRight } from "lucide-react-native";
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
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 12,
    marginTop: 20,
  },
  childCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  childName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 4,
  },
  childAgeLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: "500",
    marginBottom: 4,
  },
  developmentStage: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  dueDateCountdown: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  dueDateText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "500",
  },
  upcomingChecklistContainer: {
    marginTop: 12,
    borderTopColor: COLORS.stone200,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  upcomingTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomColor: COLORS.stone200,
    borderBottomWidth: 1,
  },
  checklistItemText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    marginLeft: 8,
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionButtonActive: {
    backgroundColor: COLORS.primary,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 8,
    textAlign: "center",
  },
  quickActionTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  addChildButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  addChildButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
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

  const formatDaysRemaining = (days: number): string => {
    if (days < 0) return "Overdue";
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `Due in ${days} days`;
  };

  const displayName = userData?.display_name || user?.email?.split("@")[0] || "Parent";

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
        <Text style={styles.greeting}>Welcome back, {displayName}</Text>

        {children.length === 0 ? (
          <View>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No children added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Create a profile for your child to get personalized guidance and
                track milestones.
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
                style={styles.quickActionButton}
                onPress={() => router.push("/(tabs)/chat")}
              >
                <Text style={{ fontSize: 24 }}>💬</Text>
                <Text style={styles.quickActionText}>Ask AI</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/(tabs)/browse")}
              >
                <Text style={{ fontSize: 24 }}>📚</Text>
                <Text style={styles.quickActionText}>Browse</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your Children</Text>
            {children.map((child) => (
              <View key={child.id} style={styles.childCard}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childAgeLabel}>{child.age_label}</Text>
                <Text style={styles.developmentStage}>
                  {getDevelopmentStage(child.age_in_weeks)}
                </Text>

                {child.age_in_weeks < 0 && child.due_date && (
                  <View style={styles.dueDateCountdown}>
                    <Text style={styles.dueDateText}>
                      🎉 Due {formatDaysRemaining(calculateDaysUntilDue(child.due_date))}
                    </Text>
                  </View>
                )}

                {upcomingItems[child.id] && upcomingItems[child.id].length > 0 && (
                  <View style={styles.upcomingChecklistContainer}>
                    <Text style={styles.upcomingTitle}>Upcoming checklist</Text>
                    {upcomingItems[child.id].map((item) => (
                      <View key={item.id} style={styles.checklistItem}>
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
                        <ChevronRight size={16} color={COLORS.stone200} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            <View style={styles.quickActionsContainer}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/(tabs)/chat")}
              >
                <Text style={{ fontSize: 24 }}>💬</Text>
                <Text style={styles.quickActionText}>Ask AI</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push("/(tabs)/browse")}
              >
                <Text style={{ fontSize: 24 }}>📚</Text>
                <Text style={styles.quickActionText}>Browse</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
