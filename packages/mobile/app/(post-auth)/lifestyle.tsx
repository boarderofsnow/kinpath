import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TAG_NAMESPACES } from "@kinpath/shared";
import { colors, fonts, typography, spacing, radii, shadows } from "../../lib/theme";
import { PressableScale } from "../../components/motion";
import { useOnboarding } from "../../lib/onboarding-context";
import { Picker } from "@react-native-picker/picker";

export default function LifestyleScreen() {
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
            <Ionicons name="leaf-outline" size={32} color={colors.brand[500]} />
          </View>
          <Text style={styles.title}>A bit more about your family</Text>
          <Text style={styles.subtitle}>
            These help us tailor content to your values. All optional.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>Religious or spiritual tradition</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={preferences.religion ?? ""}
                onValueChange={(val) =>
                  updatePreferences((p) => ({ ...p, religion: val || null }))
                }
                style={styles.picker}
              >
                <Picker.Item label="Prefer not to say" value="" />
                {TAG_NAMESPACES.faith.values.map((opt) => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Dietary preferences</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={preferences.dietary_preference ?? "omnivore"}
                onValueChange={(val) =>
                  updatePreferences((p) => ({ ...p, dietary_preference: val as any }))
                }
                style={styles.picker}
              >
                <Picker.Item label="No restrictions" value="omnivore" />
                <Picker.Item label="Vegetarian" value="vegetarian" />
                <Picker.Item label="Vegan" value="vegan" />
                <Picker.Item label="Kosher" value="kosher" />
                <Picker.Item label="Halal" value="halal" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Parenting philosophy</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={preferences.parenting_style ?? "no_preference"}
                onValueChange={(val) =>
                  updatePreferences((p) => ({ ...p, parenting_style: val as any }))
                }
                style={styles.picker}
              >
                <Picker.Item label="No strong preference" value="no_preference" />
                {TAG_NAMESPACES.parenting.values.map((opt) => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <PressableScale
          style={styles.primaryButton}
          onPress={() => router.replace("/(post-auth)/topics")}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </PressableScale>
        <PressableScale
          style={styles.skipButton}
          onPress={() => router.replace("/(post-auth)/topics")}
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
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.stone[200],
    ...shadows.card,
    gap: spacing.xl,
  },
  field: { gap: spacing.xs },
  label: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.stone[600] },
  pickerWrapper: {
    backgroundColor: colors.stone[50],
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.stone[200],
    overflow: "hidden",
  },
  picker: { height: 50 },
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
