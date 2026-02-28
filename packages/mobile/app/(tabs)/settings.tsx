import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import type {
  User,
  Child,
  UserPreferences,
  NotificationPreferences,
  HouseholdMember,
} from "@kinpath/shared";
import { colors, fonts, typography, spacing, radii, shadows, cardBase } from "../../lib/theme";
import { FadeIn, FadeInUp, PressableScale } from "../../components/motion";
import { DashboardSkeleton } from "../../components/skeleton";

// Section components
import { CollapsibleSection } from "../../components/settings/CollapsibleSection";
import { ChildrenSection } from "../../components/settings/ChildrenSection";
import { PreferencesSection } from "../../components/settings/PreferencesSection";
import { NotificationsSection } from "../../components/settings/NotificationsSection";
import { SubscriptionSection } from "../../components/settings/SubscriptionSection";
import { FamilySharingSection } from "../../components/settings/FamilySharingSection";
import { AccountSection } from "../../components/settings/AccountSection";

export default function SettingsScreen() {
  const { user, isLoading: authLoading, signOut } = useAuth();

  // ── Canonical data ─────────────────────────────
  const [userData, setUserData] = useState<User | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [isPartner, setIsPartner] = useState(false);

  // ── UI state ───────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  // ── Load all data ──────────────────────────────
  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Parallel queries
      const [userRes, childrenRes, prefsRes, notifRes] = await Promise.all([
        supabase.from("users").select("*").eq("id", user.id).single(),
        supabase
          .from("children")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase.from("user_preferences").select("*").eq("user_id", user.id).single(),
        supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single(),
      ]);

      if (userRes.data) setUserData(userRes.data);
      if (childrenRes.data) setChildren(childrenRes.data);
      if (prefsRes.data) setPreferences(prefsRes.data as UserPreferences);
      if (notifRes.data) setNotificationPrefs(notifRes.data as NotificationPreferences);

      // Household (conditional on family tier)
      if (userRes.data?.subscription_tier === "family") {
        // Check if user is a partner first
        const { data: partnerCheck } = await supabase
          .from("household_members")
          .select("household_id")
          .eq("user_id", user.id)
          .eq("status", "accepted")
          .maybeSingle();

        if (partnerCheck) {
          setIsPartner(true);
          // Load members for the household they belong to
          const { data: members } = await supabase
            .from("household_members")
            .select("*")
            .eq("household_id", partnerCheck.household_id)
            .order("invited_at", { ascending: true });
          if (members) setHouseholdMembers(members as HouseholdMember[]);
        } else {
          setIsPartner(false);
          // Check if user owns a household
          const { data: household } = await supabase
            .from("households")
            .select("id")
            .eq("owner_user_id", user.id)
            .maybeSingle();

          if (household) {
            const { data: members } = await supabase
              .from("household_members")
              .select("*")
              .eq("household_id", household.id)
              .order("invited_at", { ascending: true });
            if (members) setHouseholdMembers(members as HouseholdMember[]);
          }
        }
      }
    } catch (error) {
      console.error("Error loading settings data:", error);
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

  // ── Profile name editing ───────────────────────
  const startEditingName = () => {
    setNameInput(userData?.display_name ?? "");
    setEditingName(true);
  };

  const saveDisplayName = async () => {
    if (!nameInput.trim() || !user?.id) return;
    setNameSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ display_name: nameInput.trim() })
        .eq("id", user.id);

      if (!error && userData) {
        setUserData({ ...userData, display_name: nameInput.trim() });
      }
    } catch {
      // ignore
    } finally {
      setNameSaving(false);
      setEditingName(false);
    }
  };

  // ── Derived values ─────────────────────────────
  const displayName = userData?.display_name || user?.email?.split("@")[0] || "User";
  const userInitial = displayName.charAt(0).toUpperCase();
  const tier = userData?.subscription_tier ?? "free";
  const getAppVersion = () => Constants.expoConfig?.version || "1.0.0";

  const tierBadgeColor =
    tier === "family"
      ? colors.accent[500]
      : tier === "premium"
        ? colors.brand[500]
        : colors.stone[400];

  const tierLabel =
    tier === "free" ? "Free" : tier.charAt(0).toUpperCase() + tier.slice(1);

  // ── Loading state ──────────────────────────────
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
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand[500]}
          />
        }
      >
        {/* ── Profile Header ────────────────────── */}
        <FadeIn delay={0}>
          <LinearGradient
            colors={[colors.brand[50], colors.sage[50]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHeader}
          >
            <LinearGradient
              colors={[colors.brand[400], colors.brand[500]]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{userInitial}</Text>
            </LinearGradient>

            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  selectTextOnFocus
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={saveDisplayName}
                />
                <PressableScale onPress={saveDisplayName} disabled={nameSaving}>
                  <Ionicons name="checkmark-circle" size={28} color={colors.brand[500]} />
                </PressableScale>
                <PressableScale onPress={() => setEditingName(false)}>
                  <Ionicons name="close-circle" size={28} color={colors.stone[400]} />
                </PressableScale>
              </View>
            ) : (
              <PressableScale onPress={startEditingName} style={styles.nameRow}>
                <Text style={styles.profileName}>{displayName}</Text>
                <Ionicons name="pencil-outline" size={14} color={colors.stone[400]} />
              </PressableScale>
            )}

            <Text style={styles.profileEmail}>{user?.email}</Text>
          </LinearGradient>
        </FadeIn>

        {/* ── 1. Your Children ──────────────────── */}
        <FadeInUp delay={80}>
          <CollapsibleSection
            title="Your Children"
            icon="people-outline"
            defaultExpanded={true}
            badge={
              children.length > 0
                ? { label: String(children.length), color: colors.sage[500] }
                : undefined
            }
          >
            <ChildrenSection
              children={children}
              userId={user!.id}
              onChildrenChange={setChildren}
            />
          </CollapsibleSection>
        </FadeInUp>

        {/* ── 2. Your Preferences ───────────────── */}
        <FadeInUp delay={160}>
          <CollapsibleSection title="Your Preferences" icon="options-outline">
            <PreferencesSection
              preferences={preferences}
              userId={user!.id}
              onPreferencesChange={setPreferences}
            />
          </CollapsibleSection>
        </FadeInUp>

        {/* ── 3. Notifications ──────────────────── */}
        <FadeInUp delay={240}>
          <CollapsibleSection title="Notifications" icon="notifications-outline">
            <NotificationsSection
              notificationPrefs={notificationPrefs}
              userId={user!.id}
              onNotificationPrefsChange={setNotificationPrefs}
            />
          </CollapsibleSection>
        </FadeInUp>

        {/* ── 4. Subscription ───────────────────── */}
        <FadeInUp delay={320}>
          <CollapsibleSection
            title="Subscription"
            icon="card-outline"
            badge={{ label: tierLabel, color: tierBadgeColor }}
          >
            <SubscriptionSection
              subscriptionTier={tier as any}
              stripeCustomerId={userData?.stripe_customer_id ?? null}
              rcCustomerId={userData?.rc_customer_id ?? null}
            />
          </CollapsibleSection>
        </FadeInUp>

        {/* ── 5. Family Sharing (family tier) ───── */}
        {tier === "family" && (
          <FadeInUp delay={400}>
            <CollapsibleSection title="Family Sharing" icon="people-circle-outline">
              <FamilySharingSection
                householdMembers={householdMembers}
                isPartner={isPartner}
                onMembersChange={setHouseholdMembers}
              />
            </CollapsibleSection>
          </FadeInUp>
        )}

        {/* ── 6. Account ────────────────────────── */}
        <FadeInUp delay={tier === "family" ? 480 : 400}>
          <CollapsibleSection title="Account" icon="person-outline">
            <AccountSection onSignOut={signOut} />
          </CollapsibleSection>
        </FadeInUp>

        {/* ── Support Links ─────────────────────── */}
        <FadeInUp delay={tier === "family" ? 560 : 480}>
          <View style={styles.supportSection}>
            <View style={styles.supportCard}>
              <PressableScale style={styles.supportRow}>
                <Text style={styles.supportRowLabel}>Help & FAQ</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.stone[300]} />
              </PressableScale>
              <PressableScale style={styles.supportRow}>
                <Text style={styles.supportRowLabel}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.stone[300]} />
              </PressableScale>
              <PressableScale style={[styles.supportRow, styles.supportRowLast]}>
                <Text style={styles.supportRowLabel}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.stone[300]} />
              </PressableScale>
            </View>
          </View>
        </FadeInUp>

        {/* ── Version ───────────────────────────── */}
        <Text style={styles.versionText}>KinPath v{getAppVersion()}</Text>
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
    paddingBottom: 140, // Clear floating tab bar
  },

  // ── Profile Header ────────────────────────────
  profileHeader: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
    paddingVertical: spacing["2xl"],
    borderRadius: radii.lg,
    overflow: "hidden",
    ...shadows.card,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 26,
    fontFamily: fonts.sansBold,
    color: colors.white,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  profileName: {
    ...typography.displaySmall,
    color: colors.foreground,
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.brand[400],
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 18,
    fontFamily: fonts.sansSemiBold,
    color: colors.foreground,
    backgroundColor: colors.white,
    textAlign: "center",
  },
  profileEmail: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone[500],
  },

  // ── Support ───────────────────────────────────
  supportSection: {
    marginBottom: spacing.md,
  },
  supportCard: {
    ...cardBase,
    overflow: "hidden",
  },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.stone[200],
  },
  supportRowLast: {
    borderBottomWidth: 0,
  },
  supportRowLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.foreground,
  },

  // ── Version ───────────────────────────────────
  versionText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.stone[400],
    textAlign: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
});
