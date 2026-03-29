import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, typography, spacing, radii, shadows } from "../../lib/theme";
import { PressableScale } from "../../components/motion";
import { useOnboarding } from "../../lib/onboarding-context";

const VACCINE_OPTIONS = [
  { value: "standard", label: "Standard CDC schedule", desc: "Following the recommended vaccination timeline" },
  { value: "delayed", label: "Delayed schedule", desc: "Spreading vaccines out over a longer timeline" },
  { value: "selective", label: "Selective", desc: "Choosing some vaccines but not all" },
  { value: "hesitant", label: "Vaccine-hesitant", desc: "Still researching and deciding" },
  { value: "prefer_not_to_say", label: "Prefer not to say", desc: "" },
] as const;

export default function VaccinesScreen() {
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
            <Ionicons name="shield-checkmark-outline" size={32} color={colors.brand[500]} />
          </View>
          <Text style={styles.title}>Vaccination approach</Text>
          <Text style={styles.subtitle}>
            We respect every family's decision. This helps us present information in a way that's most useful to you.
          </Text>
        </View>

        <View style={styles.list}>
          {VACCINE_OPTIONS.map((opt) => (
            <PressableScale
              key={opt.value}
              style={[
                styles.listItem,
                preferences.vaccine_stance === opt.value && styles.listItemActive,
              ]}
              onPress={() =>
                updatePreferences((p) => ({ ...p, vaccine_stance: opt.value as any }))
              }
            >
              <Text
                style={[
                  styles.listItemTitle,
                  preferences.vaccine_stance === opt.value && styles.listItemTitleActive,
                ]}
              >
                {opt.label}
              </Text>
              {opt.desc ? (
                <Text style={styles.listItemDesc}>{opt.desc}</Text>
              ) : null}
            </PressableScale>
          ))}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <PressableScale
          style={styles.primaryButton}
          onPress={() => router.replace("/(post-auth)/lifestyle")}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </PressableScale>
        <PressableScale
          style={styles.skipButton}
          onPress={() => router.replace("/(post-auth)/lifestyle")}
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
  list: { gap: spacing.sm },
  listItem: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.stone[200],
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.soft,
  },
  listItemActive: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  listItemTitle: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.stone[800] },
  listItemTitleActive: { color: colors.brand[700] },
  listItemDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.stone[500], marginTop: 2 },
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
