import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TOPICS, TOPIC_KEYS } from "@kinpath/shared";
import { colors, fonts, typography, spacing, radii, shadows } from "../../lib/theme";
import { PressableScale } from "../../components/motion";
import { useOnboarding } from "../../lib/onboarding-context";

const TOPIC_DESCRIPTIONS: Record<string, string> = {
  prenatal: "Pregnancy health, prenatal visits, and preparing for birth",
  newborn_care: "First weeks at home, feeding basics, and newborn essentials",
  nutrition_and_diet: "Healthy eating for you and your growing child",
  vaccinations: "Immunization schedules and vaccine information",
  breastfeeding: "Breastfeeding, bottle feeding, and introducing solids",
  emotional_wellness: "Mental health, stress management, and self-care",
  sleep: "Sleep training, routines, and solving sleep challenges",
  milestones: "Tracking development and knowing what to expect",
  safety: "Childproofing, safe sleep, and injury prevention",
  postpartum: "Recovery, hormonal changes, and adjusting to parenthood",
  infant_development: "Growth, learning, and play from 0\u201312 months",
  toddler_development: "Walking, talking, and independence from 1\u20133 years",
  relationships: "Keeping your partnership strong through parenthood",
};

export default function TopicsScreen() {
  const router = useRouter();
  const { preferences, updatePreferences, saveToDatabase, saving, error, clearError } =
    useOnboarding();

  const handleContinue = async () => {
    clearError();
    const success = await saveToDatabase();
    if (success) {
      router.replace("/(post-auth)/paywall");
    }
  };

  const handleSkip = async () => {
    clearError();
    const success = await saveToDatabase();
    if (success) {
      router.replace("/(post-auth)/paywall");
    }
  };

  const toggleTopic = (key: string) => {
    updatePreferences((p) => {
      const current = p.topics_of_interest ?? [];
      const selected = current.includes(key);
      return {
        ...p,
        topics_of_interest: selected
          ? current.filter((t) => t !== key)
          : [...current, key],
      };
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles-outline" size={32} color={colors.brand[500]} />
          </View>
          <Text style={styles.title}>What interests you most?</Text>
          <Text style={styles.subtitle}>
            Select topics you'd like to see more of. You'll still have access to everything.
          </Text>
        </View>

        {preferences.topics_of_interest && preferences.topics_of_interest.length > 0 && (
          <Text style={styles.selectedCount}>
            {preferences.topics_of_interest.length} topic
            {preferences.topics_of_interest.length === 1 ? "" : "s"} selected
          </Text>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.grid}>
          {TOPIC_KEYS.map((key) => {
            const topic = TOPICS[key];
            const description = TOPIC_DESCRIPTIONS[key];
            const selected = preferences.topics_of_interest?.includes(key);
            return (
              <PressableScale
                key={key}
                style={[styles.topicCard, selected && styles.topicCardActive]}
                onPress={() => toggleTopic(key)}
              >
                <Text style={[styles.topicTitle, selected && styles.topicTitleActive]}>
                  {topic.label}
                </Text>
                {description ? (
                  <Text style={styles.topicDesc}>{description}</Text>
                ) : null}
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <PressableScale
          style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
          onPress={handleContinue}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Save & Continue</Text>
          )}
        </PressableScale>
        <PressableScale
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={saving}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["5xl"],
    paddingBottom: spacing["3xl"],
  },
  header: { alignItems: "center", marginBottom: spacing["2xl"] },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.brand[50],
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...typography.displayMedium, color: colors.foreground, textAlign: "center", marginBottom: spacing.sm },
  subtitle: { ...typography.bodyLarge, color: colors.stone[500], textAlign: "center", maxWidth: 320 },
  selectedCount: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.brand[600],
    textAlign: "center",
    marginBottom: spacing.md,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.error, flex: 1 },
  grid: { gap: spacing.sm },
  topicCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.stone[200],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.soft,
  },
  topicCardActive: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  topicTitle: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.stone[800] },
  topicTitleActive: { color: colors.brand[700] },
  topicDesc: { fontFamily: fonts.sans, fontSize: 12, color: colors.stone[500], marginTop: 2 },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  primaryButton: {
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.brand[500],
    borderRadius: radii.md, paddingVertical: 16,
    marginBottom: spacing.md,
  },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.white },
  skipButton: { alignItems: "center", paddingVertical: spacing.md },
  skipButtonText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.stone[500] },
});
