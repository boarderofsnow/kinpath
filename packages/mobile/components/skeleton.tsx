import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  View,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { colors, radii, shadows, spacing } from "../lib/theme";

// ── Base Skeleton ───────────────────────────────────────────

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = radii.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.4,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    const loop = Animated.loop(pulse);
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: `${colors.stone[200]}99`,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ── Dashboard Skeleton ──────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {/* Greeting */}
      <Skeleton width={200} height={32} borderRadius={radii.sm} />
      <View style={{ height: spacing["2xl"] }} />

      {/* Hero child card */}
      <View style={skeletonStyles.card}>
        <View style={skeletonStyles.row}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Skeleton width={120} height={18} />
            <View style={{ height: spacing.sm }} />
            <Skeleton width={80} height={14} />
          </View>
        </View>
        <View style={{ height: spacing.lg }} />
        <Skeleton width="100%" height={14} />
        <View style={{ height: spacing.sm }} />
        <Skeleton width="70%" height={14} />
      </View>

      <View style={{ height: spacing.lg }} />

      {/* Second card */}
      <View style={skeletonStyles.card}>
        <Skeleton width={140} height={16} />
        <View style={{ height: spacing.md }} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={[skeletonStyles.row, { marginBottom: spacing.md }]}>
            <Skeleton width={20} height={20} borderRadius={6} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Skeleton width="80%" height={14} />
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: spacing.lg }} />

      {/* Quick actions */}
      <View style={skeletonStyles.actionsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={skeletonStyles.actionCard}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <View style={{ height: spacing.sm }} />
            <Skeleton width={48} height={12} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Resource Card Skeleton ──────────────────────────────────

export function ResourceCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.rowBetween}>
        <Skeleton width={64} height={18} borderRadius={radii.full} />
        <Skeleton width={80} height={18} borderRadius={radii.full} />
      </View>
      <View style={{ height: spacing.md }} />
      <Skeleton width="85%" height={18} />
      <View style={{ height: spacing.sm }} />
      <Skeleton width="100%" height={14} />
      <View style={{ height: 4 }} />
      <Skeleton width="65%" height={14} />
      <View style={{ height: spacing.md }} />
      <View style={skeletonStyles.row}>
        <Skeleton width={60} height={20} borderRadius={radii.full} />
        <View style={{ width: spacing.sm }} />
        <Skeleton width={72} height={20} borderRadius={radii.full} />
      </View>
    </View>
  );
}

// ── Chat Skeleton ───────────────────────────────────────────

export function ChatSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {/* Assistant message */}
      <View style={{ alignItems: "flex-start", marginBottom: spacing.lg }}>
        <Skeleton width={240} height={60} borderRadius={radii.lg} />
      </View>
      {/* User message */}
      <View style={{ alignItems: "flex-end", marginBottom: spacing.lg }}>
        <Skeleton
          width={200}
          height={40}
          borderRadius={radii.lg}
          style={{ backgroundColor: `${colors.brand[200]}66` } as any}
        />
      </View>
      {/* Assistant message */}
      <View style={{ alignItems: "flex-start", marginBottom: spacing.lg }}>
        <Skeleton width={280} height={80} borderRadius={radii.lg} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadows.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: "center",
    ...shadows.card,
  },
});
