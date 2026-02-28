import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { resetPassword } from "../../lib/auth";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, typography, spacing, radii, shadows, cardBase } from "../../lib/theme";
import { FadeInUp, PressableScale } from "../../components/motion";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    setError("");
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.brand[50], colors.background, colors.sage[50]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {/* Decorative orbs */}
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <PressableScale
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </PressableScale>

          <FadeInUp delay={100}>
            <View style={styles.header}>
              <Image
                source={require("../../assets/kinpath-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Reset your password</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a reset link.
              </Text>
            </View>
          </FadeInUp>

          <FadeInUp delay={200}>
            {sent ? (
              /* ── Success State ─────────────────────── */
              <View style={styles.successCard}>
                <View style={styles.successIconWrap}>
                  <Ionicons name="mail-outline" size={32} color={colors.brand[500]} />
                </View>
                <Text style={styles.successTitle}>Check your email</Text>
                <Text style={styles.successBody}>
                  We sent a password reset link to{" "}
                  <Text style={styles.successEmail}>{email}</Text>.
                  {"\n"}The link expires in 1 hour.
                </Text>
                <Text style={styles.successHint}>
                  Didn't receive it? Check your spam folder or{" "}
                </Text>
                <PressableScale onPress={() => setSent(false)}>
                  <Text style={styles.tryAgainLink}>try again</Text>
                </PressableScale>
              </View>
            ) : (
              /* ── Form ──────────────────────────────── */
              <View style={styles.card}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Email address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.stone[400]}
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoFocus
                  />
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <PressableScale
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Send Reset Link</Text>
                  )}
                </PressableScale>
              </View>
            )}
          </FadeInUp>

          <FadeInUp delay={350}>
            <PressableScale
              style={styles.footer}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={16} color={colors.brand[500]} />
              <Text style={styles.backToSignIn}>Back to sign in</Text>
            </PressableScale>
          </FadeInUp>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing["2xl"],
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: spacing["3xl"],
    justifyContent: "center",
  },
  orbTop: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.brand[200],
    opacity: 0.3,
  },
  orbBottom: {
    position: "absolute",
    bottom: 60,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.sage[200],
    opacity: 0.25,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  header: {
    marginBottom: spacing["3xl"],
    alignItems: "center",
  },
  logo: {
    width: 180,
    height: 48,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.displaySmall,
    color: colors.foreground,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.stone[500],
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Form Card ────────────────────────────
  card: {
    ...cardBase,
    padding: spacing["2xl"],
    marginBottom: spacing["2xl"],
  },
  fieldContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.stone[200],
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: fonts.sans,
    color: colors.foreground,
    backgroundColor: colors.white,
  },
  error: {
    fontFamily: fonts.sansMedium,
    color: colors.error,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.brand[500],
    borderRadius: radii.xl,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: fonts.sansBold,
    color: colors.white,
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // ── Success State ────────────────────────
  successCard: {
    ...cardBase,
    padding: spacing["2xl"],
    marginBottom: spacing["2xl"],
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  successTitle: {
    ...typography.headingLarge,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  successBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.stone[600],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  successEmail: {
    fontFamily: fonts.sansSemiBold,
    color: colors.foreground,
  },
  successHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.stone[500],
    textAlign: "center",
  },
  tryAgainLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.brand[500],
    textDecorationLine: "underline",
  },

  // ── Footer ───────────────────────────────
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  backToSignIn: {
    fontFamily: fonts.sansSemiBold,
    color: colors.brand[500],
    fontSize: 14,
  },
});
