import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TAG_NAMESPACES } from "@kinpath/shared";
import { colors, fonts, typography, spacing, radii, shadows } from "../../lib/theme";
import { PressableScale } from "../../components/motion";
import { useOnboarding } from "../../lib/onboarding-context";

export default function FeedingScreen() {
  const router = useRouter();
  const { preferences, updatePreferences } = useOnboarding();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="nutrition-outline" size={32} color={colors.brand[500]} />
          </View>
          <Text style={styles.title}>Feeding plans</Text>
          <Text style={styles.subtitle}>
            Whatever you choose, we'll have resources to support you.
          </Text>
        </View>

        <View style={styles.grid}>
          {TAG_NAMESPACES.feeding.values.map((opt) => (
            <PressableScale
              key={opt.value}
              style={[
                styles.optionCard,
                preferences.feeding_preference === opt.value && styles.optionCardActive,
              ]}
              onPress={() =>
                updatePreferences((p) => ({ ...p, feeding_preference: opt.value as any }))
              }
            >
              <Text
                style={[
                  styles.optionText,
                  preferences.feeding_preference === opt.value && styles.optionTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </PressableScale>
          ))}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <PressableScale
          style={styles.primaryButton}
          onPress={() => router.replace("/(post-auth)/vaccines")}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </PressableScale>
        <PressableScale
          style={styles.skipButton}
          onPress={() => router.replace("/(post-auth)/vaccines")}
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
  header: { alignItems: "center", marginBottom: spacing["3xl"] },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.brand[50],
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...typography.displayMedium, color: colors.foreground, textAlign: "center", marginBottom: spacing.sm },
  subtitle: { ...typography.bodyLarge, color: colors.stone[500], textAlign: "center", maxWidth: 320 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  optionCard: {
    width: "47%",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.stone[200],
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    ...shadows.soft,
  },
  optionCardActive: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  optionText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.stone[600], textAlign: "center" },
  optionTextActive: { color: colors.brand[700] },
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
  primaryButtonText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.white },
  skipButton: { alignItems: "center", paddingVertical: spacing.md },
  skipButtonText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.stone[500] },
});
