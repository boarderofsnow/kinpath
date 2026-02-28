import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, typography, spacing, radii, cardBase } from "../../lib/theme";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: { label: string; color: string };
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultExpanded = false,
  badge,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const chevronAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const toggle = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(250, "easeInEaseOut", "opacity")
    );
    setExpanded((prev) => !prev);
    Animated.timing(chevronAnim, {
      toValue: expanded ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
      >
        <Ionicons name={icon} size={20} color={colors.brand[500]} />
        <Text style={styles.headerTitle}>{title}</Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: badge.color }]}>
            <Text style={styles.badgeText}>{badge.label}</Text>
          </View>
        )}
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <Ionicons name="chevron-down" size={18} color={colors.stone[400]} />
        </Animated.View>
      </Pressable>

      {/* Content */}
      {expanded && (
        <View style={styles.content}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...cardBase,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
  },
  headerPressed: {
    opacity: 0.7,
  },
  headerTitle: {
    ...typography.headingSmall,
    color: colors.foreground,
    flex: 1,
  },
  badge: {
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.white,
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: colors.stone[200],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
});
