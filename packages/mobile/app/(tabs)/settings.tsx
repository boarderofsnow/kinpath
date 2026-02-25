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
import type { User } from "@kinpath/shared";
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
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
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
  subscriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfoContainer: {
    marginBottom: 8,
  },
  email: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
});

export default function SettingsScreen() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: userRecord } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userRecord) {
        setUserData(userRecord);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
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

  const displayName = userData?.display_name || user?.email?.split("@")[0] || "User";

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
        <Text style={styles.header}>Settings</Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={[styles.row]}>
              <View style={styles.userInfoContainer}>
                <Text style={styles.rowLabel}>{displayName}</Text>
                <Text style={styles.email}>{user?.email}</Text>
              </View>
            </View>

            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.rowLabel}>Subscription</Text>
              {userData?.subscription_tier && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {userData.subscription_tier === "free"
                      ? "Free Plan"
                      : userData.subscription_tier === "premium"
                        ? "Premium"
                        : userData.subscription_tier === "family"
                          ? "Family"
                          : userData.subscription_tier}
                  </Text>
                </View>
              )}
            </View>
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

        {/* Actions */}
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

        <Text style={styles.versionText}>KinPath Expo v{getAppVersion()}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
