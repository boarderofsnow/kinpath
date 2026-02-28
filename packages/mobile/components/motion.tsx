import React, { useEffect, useRef, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from "react-native";

const EASE_OUT = Easing.out(Easing.cubic);

// ── FadeIn ──────────────────────────────────────────────────

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 500,
  style,
}: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>
  );
}

// ── FadeInUp ────────────────────────────────────────────────

export function FadeInUp({
  children,
  delay = 0,
  duration = 500,
  style,
}: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[{ opacity, transform: [{ translateY }] }, style]}
    >
      {children}
    </Animated.View>
  );
}

// ── PageTransition ──────────────────────────────────────────

export function PageTransition({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[{ opacity, transform: [{ translateY }] }, style]}
    >
      {children}
    </Animated.View>
  );
}

// ── StaggerItem ─────────────────────────────────────────────
// Use directly with an index-based delay for stagger effects

interface StaggerItemProps {
  children: ReactNode;
  index: number;
  staggerDelay?: number;
  style?: StyleProp<ViewStyle>;
}

export function StaggerItem({
  children,
  index,
  staggerDelay = 100,
  style,
}: StaggerItemProps) {
  const delay = index * staggerDelay;
  return (
    <FadeInUp delay={delay} duration={400} style={style}>
      {children}
    </FadeInUp>
  );
}

// ── PressableScale ──────────────────────────────────────────
// Wraps Pressable with scale(0.98) on press — matches web button:active

interface PressableScaleProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleTo?: number;
  activeOpacity?: number;
}

export function PressableScale({
  children,
  onPress,
  onLongPress,
  style,
  disabled = false,
  scaleTo = 0.98,
  activeOpacity = 1,
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    if (activeOpacity < 1) {
      Animated.timing(opacity, {
        toValue: activeOpacity,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    Animated.timing(opacity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  // Forward flex-layout properties to the outer Pressable so it participates
  // correctly in flex row layouts (e.g. equal-width toggle buttons).
  const flatStyle = StyleSheet.flatten(style);
  const pressableStyle: ViewStyle | undefined =
    flatStyle?.flex != null ? { flex: flatStyle.flex } : undefined;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={pressableStyle}
    >
      <Animated.View
        style={[{ transform: [{ scale }], opacity }, style]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── PulsingDot ──────────────────────────────────────────────
// For typing indicator — matches web's pulse-soft animation

interface PulsingDotProps {
  delay?: number;
  size?: number;
  color?: string;
}

export function PulsingDot({
  delay = 0,
  size = 8,
  color = "#10b89f",
}: PulsingDotProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.4,
        duration: 600,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]);

    const loop = Animated.loop(pulse);
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}
