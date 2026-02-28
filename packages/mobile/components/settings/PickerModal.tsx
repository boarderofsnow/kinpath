import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, typography, spacing, radii, shadows } from "../../lib/theme";
import { PressableScale } from "../motion";

export interface PickerOption {
  value: string;
  label: string;
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
  onClose: () => void;
  allowClear?: boolean;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

export function PickerModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  allowClear = true,
}: PickerModalProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleSelect = (value: string | null) => {
    onSelect(value);
    handleClose();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Options */}
        <ScrollView
          style={styles.optionsList}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {allowClear && (
            <PressableScale
              style={[styles.option, selectedValue === null && styles.optionSelected]}
              onPress={() => handleSelect(null)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedValue === null && styles.optionTextSelected,
                ]}
              >
                Not selected
              </Text>
              {selectedValue === null && (
                <Ionicons name="checkmark" size={18} color={colors.brand[500]} />
              )}
            </PressableScale>
          )}

          {options.map((opt) => {
            const isSelected = opt.value === selectedValue;
            return (
              <PressableScale
                key={opt.value}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleSelect(opt.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={colors.brand[500]} />
                )}
              </PressableScale>
            );
          })}
        </ScrollView>

        {/* Cancel button */}
        <PressableScale style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </PressableScale>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    maxHeight: SCREEN_HEIGHT * 0.6,
    ...shadows.cardHover,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.stone[300],
  },
  title: {
    ...typography.headingMedium,
    color: colors.foreground,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  optionsList: {
    paddingHorizontal: spacing.lg,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginBottom: 2,
  },
  optionSelected: {
    backgroundColor: colors.brand[50],
  },
  optionText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.foreground,
    flex: 1,
  },
  optionTextSelected: {
    fontFamily: fonts.sansSemiBold,
    color: colors.brand[600],
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginHorizontal: spacing.lg,
    marginBottom: spacing["3xl"],
    marginTop: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.stone[100],
  },
  cancelText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.stone[600],
  },
});
