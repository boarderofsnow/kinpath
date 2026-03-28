import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { colors, fonts, typography, spacing, radii, shadows } from "../../lib/theme";
import { PressableScale } from "../../components/motion";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import {
  ENTITLEMENT_ID,
  checkEntitlement,
  waitForIdentification,
} from "../../lib/purchases";

const FEATURES = [
  { icon: "chatbubble-ellipses-outline" as const, label: "Unlimited AI parenting guidance" },
  { icon: "people-outline" as const, label: "Share with your partner" },
  { icon: "person-add-outline" as const, label: "Unlimited child profiles" },
  { icon: "bookmark-outline" as const, label: "Bookmarks & checklists" },
  { icon: "mail-outline" as const, label: "Weekly email digests" },
  { icon: "filter-outline" as const, label: "Child-specific content filtering" },
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const [loading, setLoading] = useState(false);

  const advanceToPartnerInvite = () => {
    router.replace("/(post-auth)/partner-invite");
  };

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      await waitForIdentification();

      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });

      if (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED
      ) {
        // Give the webhook a moment to process
        setTimeout(() => api.account.syncSubscription().catch(() => {}), 2000);
        advanceToPartnerInvite();
      } else if (result === PAYWALL_RESULT.NOT_PRESENTED) {
        // Entitlement already active — sync and advance
        const hasEntitlement = await checkEntitlement();
        if (hasEntitlement) {
          api.account.syncSubscription().catch(() => {});
          advanceToPartnerInvite();
        }
      }
      // CANCELLED or ERROR — stay on screen, user can retry or skip
    } catch (error) {
      console.error("[Paywall] Error:", error);
      Alert.alert(
        "Something went wrong",
        "We couldn't load the subscription options. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await waitForIdentification();

      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });

      if (result === PAYWALL_RESULT.RESTORED) {
        setTimeout(() => api.account.syncSubscription().catch(() => {}), 2000);
        advanceToPartnerInvite();
      } else if (result === PAYWALL_RESULT.NOT_PRESENTED) {
        const hasEntitlement = await checkEntitlement();
        if (hasEntitlement) {
          api.account.syncSubscription().catch(() => {});
          advanceToPartnerInvite();
        } else {
          Alert.alert(
            "No Subscription Found",
            "We couldn't find an active subscription to restore."
          );
        }
      }
    } catch (error) {
      console.error("[Paywall] Restore error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await completeOnboarding();
    } catch {
      // completeOnboarding updates local state even if DB call fails,
      // so the guard will redirect to /(tabs) either way.
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" size={32} color={colors.accent[500]} />
          </View>
          <Text style={styles.title}>Get more from Kinpath</Text>
          <Text style={styles.subtitle}>
            Start a free trial to unlock the full experience for your family.
          </Text>
        </View>

        {/* Feature list */}
        <View style={styles.featureCard}>
          {FEATURES.map((feature) => (
            <View key={feature.label} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name={feature.icon}
                  size={20}
                  color={colors.brand[500]}
                />
              </View>
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed bottom actions */}
      <View style={styles.actions}>
        <PressableScale
          style={styles.primaryButton}
          onPress={handleStartTrial}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color={colors.white} />
              <Text style={styles.primaryButtonText}>Start Free Trial</Text>
            </>
          )}
        </PressableScale>

        <PressableScale
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={loading}
        >
          <Text style={styles.skipButtonText}>Continue with Free Plan</Text>
        </PressableScale>

        <PressableScale
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={loading}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["5xl"],
    paddingBottom: spacing["3xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: spacing["3xl"],
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.displayMedium,
    color: colors.foreground,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.stone[500],
    textAlign: "center",
    maxWidth: 300,
  },
  featureCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.stone[200],
    ...shadows.card,
    gap: spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    ...typography.bodyLarge,
    color: colors.foreground,
    flex: 1,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent[500],
    borderRadius: radii.md,
    paddingVertical: 16,
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.white,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  skipButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.stone[500],
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  restoreButtonText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.stone[400],
    textDecorationLine: "underline",
  },
});
