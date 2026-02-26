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
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { calculateAgeInWeeks, formatAgeLabel } from "@kinpath/shared";
import type { User, Child } from "@kinpath/shared";
import Constants from "expo-constants";

const COLORS = {
  primary: "#10b89f",
  secondary: "#5f8253",
  accent: "#f59e0b",
  background: "#f0eeec",
  dark: "#1c1917",
  stone200: "#e7e5e4",
  white: "#ffffff",
  error: "#dc2626",
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
  profileHeader: {
    alignItems: "center",
    marginBottom: 32,
    paddingVertical: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.white,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.dark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomColor: COLORS.stone200,
    borderBottomWidth: 1,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: "500",
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
    marginRight: 8,
    maxWidth: "60%",
  },
  badgeContainer: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeContainerFree: {
    backgroundColor: "#d1d5db",
  },
  badgeContainerPremium: {
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  childRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomColor: COLORS.stone200,
    borderBottomWidth: 1,
  },
  childRowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  childAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.dark,
  },
  childAge: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  supportRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomColor: COLORS.stone200,
    borderBottomWidth: 1,
  },
  supportRowLabel: {
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: "500",
  },
  chevron: {
    marginLeft: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  signOutButton: {
    backgroundColor: COLORS.error,
    marginTop: 20,
  },
  signOutButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  deleteButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontWeight: "500",
  },
  versionText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
});

export default function SettingsScreen() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [userData, setUserData] = useState<User | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Load user data
      const { data: userRecord } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userRecord) {
        setUserData(userRecord);
      }

      // Load children data
      const { data: childrenRecords } = await supabase
        .from("children")
        .select("*")
        .eq("parent_id", user.id)
        .order("created_at", { ascending: true });

      if (childrenRecords) {
        setChildren(childrenRecords);
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

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Sign Out",
          onPress: async () => {
            setSigningOut(true);
            try {
              const { error } = await signOut();
              if (error) {
                Alert.alert("Error", "Failed to sign out. Please try again.");
              } else {
                // AuthProvider will handle navigation to auth screens
              }
            } catch (err) {
              Alert.alert("Error", "An unexpected error occurred.");
            } finally {
              setSigningOut(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const getAppVersion = (): string => {
    return Constants.expoConfig?.version || "1.0.0";
  };

  const getSubscriptionBadgeStyle = () => {
    if (userData?.subscription_tier === "free") {
      return styles.badgeContainerFree;
    } else if (userData?.subscription_tier === "premium") {
      return styles.badgeContainerPremium;
    } else if (userData?.subscription_tier === "family") {
      return { backgroundColor: COLORS.accent };
    }
    return styles.badgeContainer;
  };

  const getSubscriptionLabel = (): string => {
    if (!userData?.subscription_tier) return "Free Plan";
    switch (userData.subscription_tier) {
      case "free":
        return "Free Plan";
      case "premium":
        return "Premium";
      case "family":
        return "Family";
      default:
        return userData.subscription_tier;
    }
  };

  const displayName = userData?.display_name || user?.email?.split("@")[0] || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

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
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.rowLabel}>Subscription</Text>
              {userData?.subscription_tier && (
                <View style={[styles.badgeContainer, getSubscriptionBadgeStyle()]}>
                  <Text style={styles.badgeText}>
                    {getSubscriptionLabel()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Children Section */}
        {children && children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Children</Text>
            <View style={styles.card}>
              {children.map((child, index) => {
                const childInitial = child.name.charAt(0).toUpperCase();
                const ageInWeeks = calculateAgeInWeeks(child);
                const ageLabel = formatAgeLabel(ageInWeeks);

                return (
                  <View
                    key={child.id}
                    style={[
                      styles.childRow,
                      index === children.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.childRowContent}>
                      <View style={styles.childAvatar}>
                        <Text style={styles.childAvatarText}>{childInitial}</Text>
                      </View>
                      <View style={styles.childInfo}>
                        <Text style={styles.childName}>{child.name}</Text>
                        <Text style={styles.childAge}>{ageLabel}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={COLORS.stone200}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.supportRow}>
              <Text style={styles.supportRowLabel}>Help & FAQ</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.stone200}
                style={styles.chevron}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportRow}>
              <Text style={styles.supportRowLabel}>Privacy Policy</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.stone200}
                style={styles.chevron}
              />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.supportRow, styles.rowLast]}>
              <Text style={styles.supportRowLabel}>Terms of Service</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.stone200}
                style={styles.chevron}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.rowLabel}>App Version</Text>
              <Text style={styles.rowValue}>{getAppVersion()}</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color={COLORS.white} />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Danger Zone - Delete Account */}
        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>KinPath Expo v{getAppVersion()}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
