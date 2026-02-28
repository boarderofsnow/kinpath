import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SubscriptionTier } from "@kinpath/shared";
import { TIER_LIMITS } from "@kinpath/shared";
import { colors, fonts, typography, spacing, radii } from "../../lib/theme";
import { PressableScale } from "../motion";
import { api } from "../../lib/api";

interface SubscriptionSectionProps {
  subscriptionTier: SubscriptionTier;
  stripeCustomerId: string | null;
  rcCustomerId: string | null;
}

const TIER_DESCRIPTIONS: Record<SubscriptionTier, string> = {
  free: "5 AI questions/month, 1 child profile, basic resources",
  premium: "Unlimited AI, full library, bookmarks, email digests",
  family: "Everything in Premium plus partner sharing",
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
}: SubscriptionSectionProps) {
  const [loading, setLoading] = useState(false);
  const isPaid = subscriptionTier !== "free";
  const isRevenueCat = !!rcCustomerId;
  const isStripe = !!stripeCustomerId && !rcCustomerId;

  const handleUpgrade = async () => {
    // TODO: Integrate RevenueCat offerings for IAP
    // For now, show a placeholder message
    // In production: use Purchases.getOfferings() and presentPaywall
    setLoading(true);
    try {
      // Placeholder: Open web pricing page
      await Linking.openURL("https://kinpath.family/pricing");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      if (isRevenueCat) {
        // Open platform-specific subscription management
        if (Platform.OS === "ios") {
          await Linking.openURL("https://apps.apple.com/account/subscriptions");
        } else {
          await Linking.openURL(
            "https://play.google.com/store/account/subscriptions"
          );
        }
      } else if (isStripe) {
        // Open Stripe billing portal
        const { data, error } = await api.stripe.portal();
        if (error) {
          console.error("Stripe portal error:", error);
          return;
        }
        if (data && typeof data === "object" && "url" in data) {
          await Linking.openURL((data as { url: string }).url);
        }
      }
    } catch {
      console.error("Failed to open subscription management");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Current Plan */}
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
                : subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.planDescription}>
          {TIER_DESCRIPTIONS[subscriptionTier]}
        </Text>

        {/* Feature highlights */}
        <View style={styles.featureList}>
          <FeatureRow
            label={`${TIER_LIMITS[subscriptionTier].ai_questions_per_month ?? "Unlimited"} AI questions/mo`}
            enabled={true}
          />
          <FeatureRow
            label="Full resource library"
            enabled={TIER_LIMITS[subscriptionTier].full_library_access}
          />
          <FeatureRow
            label="Bookmarks"
            enabled={TIER_LIMITS[subscriptionTier].bookmarks_enabled}
          />
          <FeatureRow
            label="Email digests"
            enabled={TIER_LIMITS[subscriptionTier].email_digests_enabled}
          />
          <FeatureRow
            label="Partner sharing"
            enabled={TIER_LIMITS[subscriptionTier].partner_invite_enabled}
          />
        </View>
      </View>

      {/* Action button */}
      {isPaid ? (
        <PressableScale
          style={styles.manageButton}
          onPress={handleManageSubscription}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.brand[500]} size="small" />
          ) : (
            <>
              <Ionicons name="card-outline" size={18} color={colors.brand[500]} />
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </>
          )}
        </PressableScale>
      ) : (
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
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
            </>
          )}
        </PressableScale>
      )}

      {isPaid && (
        <Text style={styles.manageHint}>
          {isRevenueCat
            ? "Change plan or cancel through the App Store"
            : "Change plan, update payment method, or cancel"}
        </Text>
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
      <Text style={[featureStyles.label, !enabled && featureStyles.labelDisabled]}>
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
  },
  upgradeButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.white,
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
