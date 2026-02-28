import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import {
  calculateAgeInWeeks,
  formatAgeLabel,
  getDevelopmentStage,
} from "@kinpath/shared";
import type { Child, ChildWithAge, ChecklistItem, User } from "@kinpath/shared";
import { colors, fonts, typography, spacing, radii, shadows, cardBase } from "../../lib/theme";
import { FadeIn, FadeInUp, StaggerItem, PressableScale } from "../../components/motion";
import { DashboardSkeleton } from "../../components/skeleton";

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
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data: userRecord } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userRecord) setUserData(userRecord);

      const { data: childrenData } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (childrenData) {
        const enrichedChildren: EnrichedChild[] = childrenData.map((child: Child) => {
          const ageInWeeks = calculateAgeInWeeks(child);
          return {
            ...child,
            age_in_weeks: ageInWeeks,
            age_label: formatAgeLabel(ageInWeeks),
          };
        });

        setChildren(enrichedChildren);

        if (enrichedChildren.length > 0) {
          const childIds = enrichedChildren.map((c) => c.id);
          const { data: checklistData } = await supabase
            .from("checklist_items")
            .select("*")
            .in("child_id", childIds)
            .eq("is_completed", false)
            .order("due_date", { ascending: true })
            .limit(30);

          if (checklistData) {
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
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDueDate = (dueDate: string): string => {
    const weeks = Math.ceil(calculateDaysUntilDue(dueDate) / 7);
    if (weeks < 0) return "Due soon";
    if (weeks === 0) return "This week";
    if (weeks === 1) return "1 week to go";
    return `${weeks} weeks to go`;
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const displayName = userData?.display_name || user?.email?.split("@")[0] || "Parent";

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DashboardSkeleton />
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
            tintColor={colors.brand[500]}
          />
        }
      >
        {/* Greeting */}
        <FadeIn delay={0}>
          <Text style={styles.greeting}>
            {getGreeting()},{"\n"}
            <Text style={styles.greetingName}>{displayName}</Text>
          </Text>
        </FadeIn>

        {children.length === 0 ? (
          /* ── Empty State ──────────────────────────── */
          <FadeInUp delay={150}>
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="people-outline" size={44} color={colors.brand[400]} />
              </View>
              <Text style={styles.emptyStateTitle}>Welcome to KinPath!</Text>
              <Text style={styles.emptyStateSubtext}>
                Start by adding your child to get personalized guidance, track milestones,
                and access expert resources.
              </Text>
              <PressableScale
                style={styles.addChildButton}
                onPress={() => router.push("/settings")}
              >
                <Text style={styles.addChildButtonText}>Add Your First Child</Text>
              </PressableScale>
            </View>
          </FadeInUp>
        ) : (
          /* ── Children Cards ───────────────────────── */
          <>
            <Text style={styles.sectionTitle}>Your Children</Text>
            {children.map((child, index) => {
              const isPrenatal = child.age_in_weeks < 0;
              const childInitial = child.name.charAt(0).toUpperCase();
              const upcomingForChild = upcomingItems[child.id] || [];
              const lastIndex = upcomingForChild.length - 1;

              return (
                <StaggerItem key={child.id} index={index} staggerDelay={120}>
                  <PressableScale
                    style={styles.childCard}
                    onPress={() => router.push(`/child/${child.id}` as any)}
                  >
                    {/* Gradient header strip */}
                    <LinearGradient
                      colors={
                        isPrenatal
                          ? [colors.accent[50], colors.accent[100], colors.white]
                          : [colors.brand[50], colors.sage[50], colors.white]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.childCardGradient}
                    />

                    <View style={styles.childCardContent}>
                      <View style={styles.childHeader}>
                        <LinearGradient
                          colors={
                            isPrenatal
                              ? [colors.accent[400], colors.accent[500]]
                              : [colors.brand[400], colors.brand[500]]
                          }
                          style={styles.childAvatar}
                        >
                          <Text style={styles.childAvatarText}>{childInitial}</Text>
                        </LinearGradient>
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
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={colors.stone[300]}
                        />
                      </View>

                      <Text style={styles.developmentStage}>
                        {getDevelopmentStage(child.age_in_weeks)}
                      </Text>

                      {isPrenatal && child.due_date && (
                        <LinearGradient
                          colors={[colors.accent[400], colors.accent[500]]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.dueDateBadge}
                        >
                          <Ionicons name="calendar-outline" size={14} color={colors.white} />
                          <Text style={styles.dueDateText}>
                            {formatDueDate(child.due_date)}
                          </Text>
                        </LinearGradient>
                      )}

                      {upcomingForChild.length > 0 && (
                        <View style={styles.upcomingSection}>
                          <Text style={styles.upcomingTitle}>Upcoming checklist</Text>
                          {upcomingForChild.map((item, idx) => (
                            <PressableScale
                              key={item.id}
                              style={[
                                styles.checklistItem,
                                idx === lastIndex && styles.checklistItemLast,
                              ]}
                              onPress={() => router.push("/(tabs)/checklist")}
                            >
                              <View
                                style={[
                                  styles.checkbox,
                                  item.is_completed && styles.checkboxChecked,
                                ]}
                              >
                                {item.is_completed && (
                                  <Ionicons name="checkmark" size={12} color={colors.white} />
                                )}
                              </View>
                              <Text style={styles.checklistItemText} numberOfLines={1}>
                                {item.title}
                              </Text>
                              <Ionicons
                                name="chevron-forward"
                                size={14}
                                color={colors.stone[300]}
                              />
                            </PressableScale>
                          ))}
                        </View>
                      )}
                    </View>
                  </PressableScale>
                </StaggerItem>
              );
            })}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing["3xl"],
  },

  // ── Greeting ──────────────────────────────
  greeting: {
    ...typography.displayMedium,
    color: colors.stone[500],
    marginBottom: spacing["2xl"],
  },
  greetingName: {
    color: colors.foreground,
  },

  // ── Section Title ─────────────────────────
  sectionTitle: {
    ...typography.overline,
    color: colors.stone[500],
    marginBottom: spacing.md,
  },

  // ── Child Card ────────────────────────────
  childCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadows.card,
  },
  childCardGradient: {
    height: 6,
  },
  childCardContent: {
    padding: spacing.lg,
  },
  childHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  childAvatarText: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    color: colors.white,
  },
  childHeaderText: {
    flex: 1,
  },
  childName: {
    ...typography.headingLarge,
    color: colors.foreground,
    marginBottom: 2,
  },
  childAgeLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.brand[500],
  },
  childAgeLabelPrenatal: {
    color: colors.accent[500],
  },
  developmentStage: {
    ...typography.labelMedium,
    color: colors.stone[400],
    marginBottom: spacing.md,
  },

  // ── Due Date Badge ────────────────────────
  dueDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  dueDateText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.white,
  },

  // ── Upcoming Checklist ────────────────────
  upcomingSection: {
    borderTopColor: colors.stone[200],
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  upcomingTitle: {
    ...typography.overline,
    color: colors.stone[400],
    marginBottom: spacing.sm,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomColor: `${colors.stone[200]}66`,
    borderBottomWidth: 1,
  },
  checklistItemLast: {
    borderBottomWidth: 0,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderColor: colors.brand[400],
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  checklistItemText: {
    flex: 1,
    ...typography.labelMedium,
    color: colors.foreground,
    marginLeft: spacing.md,
  },

  // ── Empty State ───────────────────────────
  emptyState: {
    ...cardBase,
    padding: spacing["3xl"],
    alignItems: "center",
    marginTop: spacing.lg,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    ...typography.displaySmall,
    color: colors.foreground,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyStateSubtext: {
    ...typography.bodyMedium,
    color: colors.stone[500],
    textAlign: "center",
    marginBottom: spacing["2xl"],
  },
  addChildButton: {
    backgroundColor: colors.brand[500],
    borderRadius: radii.full,
    paddingVertical: 14,
    paddingHorizontal: spacing["3xl"],
    alignItems: "center",
    ...shadows.glow,
  },
  addChildButtonText: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 15,
  },

});
