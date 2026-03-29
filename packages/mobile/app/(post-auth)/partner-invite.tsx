import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, typography, spacing, radii, shadows } from "../../lib/theme";
import { PressableScale } from "../../components/motion";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";

export default function PartnerInviteScreen() {
  const { completeOnboarding, user } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendInvite = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter an email address.");
      return;
    }
    setError(null);
    setSending(true);

    try {
      const { error: apiError } = await api.household.invite({
        email: trimmedEmail,
        display_name: displayName.trim() || null,
      });

      if (apiError) {
        setError(apiError);
        setSending(false);
        return;
      }

      // Set onboarding_step in DB, then complete onboarding locally
      if (user?.id) {
        await supabase
          .from("users")
          .update({ onboarding_step: "complete" })
          .eq("id", user.id);
      }
      await completeOnboarding();
    } catch {
      setError("Network error. Please try again.");
      setSending(false);
    }
  };

  const handleSkip = async () => {
    setSending(true);
    try {
      if (user?.id) {
        await supabase
          .from("users")
          .update({ onboarding_step: "complete" })
          .eq("id", user.id);
      }
      await completeOnboarding();
    } catch {
      // Local state update will still trigger nav guard redirect
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="people-outline" size={32} color={colors.brand[500]} />
          </View>
          <Text style={styles.title}>Share the journey</Text>
          <Text style={styles.subtitle}>
            Invite your partner to share child profiles, checklists, and AI-powered parenting guidance.
          </Text>
        </View>

        {/* Invite form */}
        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>Partner's email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              placeholder="name@example.com"
              placeholderTextColor={colors.stone[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              editable={!sending}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Their name (optional)</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="First name"
              placeholderTextColor={colors.stone[400]}
              autoCapitalize="words"
              editable={!sending}
            />
          </View>

          {error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Fixed bottom actions */}
      <View style={styles.actions}>
        <PressableScale
          style={styles.primaryButton}
          onPress={handleSendInvite}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color={colors.white} />
              <Text style={styles.primaryButtonText}>Send Invite</Text>
            </>
          )}
        </PressableScale>

        <PressableScale
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={sending}
        >
          <Text style={styles.skipButtonText}>I'll do this later</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["5xl"],
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
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
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
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brand[500],
    borderRadius: radii.md,
    paddingVertical: 16,
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.white,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  skipButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.stone[500],
  },
});
