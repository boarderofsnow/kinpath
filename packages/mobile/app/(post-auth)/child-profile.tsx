import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors, fonts, typography, spacing, radii, shadows } from "../../lib/theme";
import { PressableScale } from "../../components/motion";
import { useOnboarding } from "../../lib/onboarding-context";

export default function ChildProfileScreen() {
  const router = useRouter();
  const { childName, setChildName, isBorn, setIsBorn, childDate, setChildDate } =
    useOnboarding();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isValid = childName.trim() && isBorn !== null && childDate;

  const handleDateChange = (_: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (date) {
      setChildDate(date.toISOString().split("T")[0]);
    }
  };

  const displayDate = childDate
    ? new Date(childDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="heart-outline" size={32} color={colors.brand[500]} />
          </View>
          <Text style={styles.title}>Tell us about your little one</Text>
          <Text style={styles.subtitle}>
            This helps us personalize your experience from day one.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>Child's name (or nickname)</Text>
            <TextInput
              style={styles.input}
              value={childName}
              onChangeText={setChildName}
              placeholder="e.g., Baby, Emma, Little One"
              placeholderTextColor={colors.stone[400]}
              autoCapitalize="words"
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Has your baby been born yet?</Text>
            <View style={styles.toggleRow}>
              <PressableScale
                style={[
                  styles.toggleButton,
                  isBorn === true && styles.toggleButtonActive,
                ]}
                onPress={() => setIsBorn(true)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isBorn === true && styles.toggleTextActive,
                  ]}
                >
                  Yes, already born
                </Text>
              </PressableScale>
              <PressableScale
                style={[
                  styles.toggleButton,
                  isBorn === false && styles.toggleButtonActive,
                ]}
                onPress={() => setIsBorn(false)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isBorn === false && styles.toggleTextActive,
                  ]}
                >
                  Not yet, expecting!
                </Text>
              </PressableScale>
            </View>
          </View>

          {isBorn !== null && (
            <View style={styles.field}>
              <Text style={styles.label}>
                {isBorn ? "Date of birth" : "Expected due date"}
              </Text>
              <PressableScale
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.stone[500]} />
                <Text style={[styles.dateText, !displayDate && styles.datePlaceholder]}>
                  {displayDate ?? "Select a date"}
                </Text>
              </PressableScale>
              {showDatePicker && (
                <DateTimePicker
                  value={childDate ? new Date(childDate) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={isBorn ? new Date() : undefined}
                  minimumDate={!isBorn ? new Date() : undefined}
                  onChange={handleDateChange}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <PressableScale
          style={[styles.primaryButton, !isValid && styles.primaryButtonDisabled]}
          onPress={() => router.replace("/(post-auth)/birth-preference")}
          disabled={!isValid}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: colors.brand[50],
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
    maxWidth: 320,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.stone[200],
    ...shadows.card,
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.stone[600],
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.foreground,
    backgroundColor: colors.stone[50],
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.stone[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  toggleButton: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.stone[200],
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  toggleButtonActive: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  toggleText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.stone[600],
  },
  toggleTextActive: {
    color: colors.brand[700],
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.stone[50],
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.stone[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dateText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.foreground,
  },
  datePlaceholder: {
    color: colors.stone[400],
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand[500],
    borderRadius: radii.md,
    paddingVertical: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.white,
  },
});
