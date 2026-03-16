import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import type { SubscriptionTier } from "@kinpath/shared";
import { TIER_LIMITS } from "@kinpath/shared";
import { colors, fonts, typography, spacing, radii } from "../../lib/theme";
import { PressableScale } from "../motion";
import { api } from "../../lib/api";
import { Linking, Platform } from "react-native";
import { ENTITLEMENT_ID } from "../../lib/purchases";

interface SubscriptionSectionProps {
  subscriptionTier: SubscriptionTier;
  stripeCustomerId: string | null;
  rcCustomerId: string | null;
  /** Called after a successful purchase or restore so the parent can refresh tier data. */
  onSubscriptionChange?: () => void;
}

const TIER_DESCRIPTIONS: Record<SubscriptionTier, string> = {
  free: "5 AI questions/month, 1 child profile, full resource library",
  premium: "Unlimited AI, unlimited children, partner sharing",
  family: "Everything in Premium plus up to 5 caregivers",
};

const TIER_BADGE_COLORS: Record<SubscriptionTier, string> = {
  free: colors.stone[400],
  premium: colors.brand[500],
  family: colors.accent[500],
};

export function SubscriptionSection({
  subscriptionTier,
  stripeCustomerId,
  rcCustomerId,
  onSubscriptionChange,
}: SubscriptionSectionProps) {
  const [loading, setLoading] = useState(false);
  const isPaid = subscriptionTier !== "free";
  // On mobile, use RevenueCat unless the user explicitly subscribed via Stripe on web
  const isStripe = !!stripeCustomerId && !rcCustomerId;
  const isRevenueCat = !isStripe;

  // ── Upgrade (free → paid) ────────────────────────────────────────────────
  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });

      if (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED
      ) {
        Alert.alert(
          "You're all set!",
          "Your Kinpath Pro subscription is now active. Pull down to refresh if your plan hasn't updated yet.",
          [{ text: "Got it", onPress: onSubscriptionChange }]
        );
      }
    } catch (error) {
      console.error("[RevenueCat] Paywall error:", error);
      Alert.alert(
        "Something went wrong",
        "We couldn't load the subscription options. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Manage existing subscription ─────────────────────────────────────────
  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      if (isRevenueCat) {
        // RevenueCat Customer Center — lets users cancel, request refunds,
        // restore purchases, and contact support without leaving the app.
        await RevenueCatUI.presentCustomerCenter();
        // Refresh tier in case the user downgraded or restored.
        onSubscriptionChange?.();
      } else if (isStripe) {
        const { data, error } = await api.stripe.portal();
        if (error) {
          console.error("Stripe portal error:", error);
          return;
        }
        if (data && typeof data === "object" && "url" in data) {
          await Linking.openURL((data as { url: string }).url);
        }
      } else {
        // Fallback: open platform subscription management directly
        const url =
          Platform.OS === "ios"
            ? "https://apps.apple.com/account/subscriptions"
            : "https://play.google.com/store/account/subscriptions";
        await Linking.openURL(url);
      }
    } catch {
      console.error("[RevenueCat] Failed to open subscription management");
    } finally {
      setLoading(false);
    }
  };

  // ── Restore purchases ────────────────────────────────────────────────────
  const handleRestore = async () => {
    setLoading(true);
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });
      if (result === PAYWALL_RESULT.RESTORED) {
        Alert.alert(
          "Purchases restored",
          "Your previous subscription has been restored.",
          [{ text: "Got it", onPress: onSubscriptionChange }]
        );
      }
    } catch (error) {
      console.error("[RevenueCat] Restore error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* ── Current Plan ──────────────────────────────── */}
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <View
            style={[
              styles.planBadge,
              { backgroundColor: TIER_BADGE_COLORS[subscriptionTier] },
            ]}
          >
            <Text style={styles.planBadgeText}>
              {subscriptionTier === "free"
                ? "Free Plan"
                : subscriptionTier.charAt(0).toUpperCase() +
                  subscriptionTier.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.planDescription}>
          {TIER_DESCRIPTIONS[subscriptionTier]}
        </Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          <FeatureRow
            label={`${TIER_LIMITS[subscriptionTier].ai_questions_per_month ?? "Unlimited"} AI questions/mo`}
            enabled={true}
          />
          <FeatureRow
            label={
              TIER_LIMITS[subscriptionTier].max_children === null
                ? "Unlimited child profiles"
                : `${TIER_LIMITS[subscriptionTier].max_children} child profile`
            }
            enabled={true}
          />
          <FeatureRow
            label="Full resource library"
            enabled={TIER_LIMITS[subscriptionTier].full_library_access}
          />
          <FeatureRow
            label="Child-specific filtering"
            enabled={TIER_LIMITS[subscriptionTier].child_filter_enabled}
          />
          <FeatureRow
            label="Bookmarks & checklists"
            enabled={TIER_LIMITS[subscriptionTier].bookmarks_enabled}
          />
          <FeatureRow
            label="Email digests"
            enabled={TIER_LIMITS[subscriptionTier].email_digests_enabled}
          />
          <FeatureRow
            label={
              subscriptionTier === "family"
                ? "Up to 5 caregivers"
                : "Partner sharing"
            }
            enabled={TIER_LIMITS[subscriptionTier].partner_invite_enabled}
          />
        </View>
      </View>

      {/* ── Action buttons ────────────────────────────── */}
      {isPaid ? (
        <>
          <PressableScale
            style={styles.manageButton}
            onPress={handleManageSubscription}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.brand[500]} size="small" />
            ) : (
              <>
                <Ionicons
                  name="card-outline"
                  size={18}
                  color={colors.brand[500]}
                />
                <Text style={styles.manageButtonText}>
                  Manage Subscription
                </Text>
              </>
            )}
          </PressableScale>
          <Text style={styles.manageHint}>
            {isRevenueCat
              ? "Cancel, get support, or restore through Customer Center"
              : "Change plan, update payment method, or cancel"}
          </Text>
        </>
      ) : (
        <>
          <PressableScale
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color={colors.white} />
                <Text style={styles.upgradeButtonText}>
                  Upgrade to Kinpath Pro
                </Text>
              </>
            )}
          </PressableScale>

          <PressableScale
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={loading}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </PressableScale>
        </>
      )}
    </View>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <View style={featureStyles.row}>
      <Ionicons
        name={enabled ? "checkmark-circle" : "close-circle-outline"}
        size={16}
        color={enabled ? colors.brand[500] : colors.stone[300]}
      />
      <Text
        style={[featureStyles.label, !enabled && featureStyles.labelDisabled]}
      >
        {label}
      </Text>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.foreground,
  },
  labelDisabled: {
    color: colors.stone[400],
  },
});

const styles = StyleSheet.create({
  planCard: {
    backgroundColor: colors.stone[50],
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.stone[200],
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  planBadge: {
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  planBadgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.white,
  },
  planDescription: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.stone[500],
    marginBottom: spacing.md,
  },
  featureList: {
    gap: 2,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.accent[500],
    borderRadius: radii.md,
    paddingVertical: 14,
    marginBottom: spacing.sm,
  },
  upgradeButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.white,
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
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.brand[500],
    borderRadius: radii.md,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  manageButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.brand[500],
  },
  manageHint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.stone[400],
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
