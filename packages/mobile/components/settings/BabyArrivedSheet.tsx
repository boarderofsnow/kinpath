import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, radii } from "../../lib/theme";
import { PressableScale } from "../motion";
import { DatePickerInput } from "./DatePickerInput";
import { api } from "../../lib/api";
import type { Child } from "@kinpath/shared";

const COPPER = "#C4956A";

interface BabyArrivedSheetProps {
  child: Child;
  onClose: () => void;
  onSuccess: (updatedChild: Child) => void;
}

export function BabyArrivedSheet({
  child,
  onClose,
  onSuccess,
}: BabyArrivedSheetProps) {
  const [dob, setDob] = useState<Date | null>(null);
  const [name, setName] = useState(child.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState(false);

  function toISODate(d: Date): string {
    return d.toISOString().split("T")[0];
  }

  async function handleConfirm() {
    if (!dob) {
      setError("Please select the date of birth");
      return;
    }

    setLoading(true);
    setError(null);

    const dobStr = toISODate(dob);
    const body: { dob: string; name?: string } = { dob: dobStr };
    if (name.trim() && name.trim() !== child.name) {
      body.name = name.trim();
    }

    const { error: apiError } = await api.children.markBorn(child.id, body);
    setLoading(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    setCelebrated(true);

    const updatedChild: Child = {
      ...child,
      is_born: true,
      dob: dobStr,
      ...(body.name ? { name: body.name } : {}),
    };

    setTimeout(() => {
      onSuccess(updatedChild);
    }, 2500);
  }

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.stone[400]} />
          </TouchableOpacity>

          {celebrated ? (
            /* ── Celebration state ── */
            <View style={styles.celebrationContainer}>
              <View style={styles.celebrationIcon}>
                <Ionicons name="heart" size={32} color={COPPER} />
              </View>
              <Text style={styles.celebrationTitle}>
                Welcome, {name || child.name}!
              </Text>
              <Text style={styles.celebrationBody}>
                What a beautiful new chapter. We&apos;re here for every moment.
              </Text>
            </View>
          ) : (
            /* ── Form state ── */
            <>
              <View style={styles.header}>
                <View style={styles.headerBadge}>
                  <Ionicons name="sparkles" size={14} color={COPPER} />
                  <Text style={styles.headerBadgeText}>A milestone moment</Text>
                </View>
                <Text style={styles.title}>Welcome to the world!</Text>
                <Text style={styles.subtitle}>
                  Let&apos;s record this special moment for {child.name}.
                </Text>
              </View>

              <View style={styles.form}>
                {/* Name field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Baby&apos;s name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    placeholder={child.name}
                    placeholderTextColor={colors.stone[400]}
                  />
                  <Text style={styles.hint}>Update if you&apos;ve chosen a different name</Text>
                </View>

                {/* Date picker */}
                <DatePickerInput
                  label="Date of birth"
                  value={dob}
                  onChange={setDob}
                  maximumDate={new Date()}
                />

                {/* Error */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <PressableScale
                  style={[styles.confirmButton, (!dob || loading) && styles.buttonDisabled]}
                  onPress={handleConfirm}
                  disabled={!dob || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <>
                      <Ionicons name="heart" size={16} color={colors.white} />
                      <Text style={styles.confirmButtonText}>Record this moment</Text>
                    </>
                  )}
                </PressableScale>
                <PressableScale style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </PressableScale>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    paddingBottom: spacing["5xl"],
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.stone[200],
    borderRadius: 2,
    alignSelf: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  closeButton: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    padding: spacing.xs,
  },
  header: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: "#fffbf5",
    borderBottomWidth: 1,
    borderBottomColor: "#fde8cc",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  headerBadgeText: {
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: COPPER,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.stone[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone[600],
  },
  form: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  fieldContainer: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.stone[700],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.stone[300],
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.stone[900],
  },
  hint: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.stone[400],
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  errorText: {
    fontSize: 13,
    fontFamily: fonts.sans,
    color: "#dc2626",
  },
  actions: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: COPPER,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    shadowColor: COPPER,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.white,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  cancelButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.stone[500],
  },
  // Celebration styles
  celebrationContainer: {
    alignItems: "center",
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing["4xl"],
    paddingBottom: spacing["2xl"],
  },
  celebrationIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  celebrationTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.stone[900],
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  celebrationBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone[600],
    textAlign: "center",
  },
});
