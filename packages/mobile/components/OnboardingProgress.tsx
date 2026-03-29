import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, spacing } from "../lib/theme";

interface OnboardingProgressProps {
  currentIndex: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentIndex, totalSteps }: OnboardingProgressProps) {
  const progress = ((currentIndex + 1) / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Step {currentIndex + 1} of {totalSteps}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.stone[400],
    marginBottom: spacing.xs,
  },
  track: {
    height: 4,
    backgroundColor: colors.stone[200],
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: 4,
    backgroundColor: colors.brand[500],
    borderRadius: 2,
  },
});
