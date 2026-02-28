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
import { Link, useRouter, useNavigation } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, typography, spacing, radii, shadows, cardBase } from "../../lib/theme";
import { FadeInUp, PressableScale } from "../../components/motion";

export default function RegisterScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { signUp, signInWithApple, signInWithGoogle } = useAuth();
  const canGoBack = navigation.canGoBack();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"apple" | "google" | null>(null);
  const [error, setError] = useState("");
  const [emailConfirmRequired, setEmailConfirmRequired] = useState(false);

  const validateForm = () => {
    if (!displayName.trim()) { setError("Display name is required"); return false; }
    if (!email.trim()) { setError("Email is required"); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("Please enter a valid email address"); return false; }
    if (!password) { setError("Password is required"); return false; }
    if (password.length < 8) { setError("Password must be at least 8 characters long"); return false; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return false; }
    return true;
  };

  const handleSignUp = async () => {
    setError("");
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await signUp(email, password, displayName);
      if (result.error) { setError(result.error.message); setIsLoading(false); return; }

      // If Supabase returned an active session, go straight to the app.
      // Otherwise email confirmation is required — show success message.
      if (result.data?.session) {
        router.replace("/(tabs)");
      } else {
        setEmailConfirmRequired(true);
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError("");
    setSocialLoading("apple");
    try {
      const { error: appleError } = await signInWithApple();
      if (appleError) {
        if (appleError.message !== "Sign in was cancelled") {
          setError(appleError.message);
        }
        setSocialLoading(null);
        return;
      }
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apple sign in failed");
      setSocialLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSocialLoading("google");
    try {
      const { error: googleError } = await signInWithGoogle();
      if (googleError) {
        if (googleError.message !== "Sign in was cancelled") {
          setError(googleError.message);
        }
        setSocialLoading(null);
        return;
      }
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed");
      setSocialLoading(null);
    }
  };

  const isAnyLoading = isLoading || socialLoading !== null;

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
            onPress={() => canGoBack ? router.back() : router.replace("/")}
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
              <Text style={styles.subtitle}>
                {emailConfirmRequired ? "Almost there!" : "Create your account"}
              </Text>
            </View>
          </FadeInUp>

          {emailConfirmRequired ? (
            /* ── Email Confirmation State ──────────── */
            <>
              <FadeInUp delay={200}>
                <View style={styles.confirmCard}>
                  <View style={styles.confirmIconWrap}>
                    <Ionicons name="mail-outline" size={32} color={colors.brand[500]} />
                  </View>
                  <Text style={styles.confirmTitle}>Check your email</Text>
                  <Text style={styles.confirmBody}>
                    We sent a confirmation link to{"\n"}
                    <Text style={styles.confirmEmail}>{email}</Text>
                  </Text>
                  <Text style={styles.confirmHint}>
                    Tap the link in the email to activate your account, then come back here to sign in.
                  </Text>
                </View>
              </FadeInUp>

              <FadeInUp delay={350}>
                <PressableScale
                  style={styles.button}
                  onPress={() => router.replace("/(auth)/login")}
                >
                  <Text style={styles.buttonText}>Go to Sign In</Text>
                </PressableScale>
              </FadeInUp>
            </>
          ) : (
            /* ── Registration Form ────────────────── */
            <>
              {/* Social Auth Buttons */}
              <FadeInUp delay={150}>
                <View style={styles.socialSection}>
                  {Platform.OS === "ios" && (
                    <PressableScale
                      style={[styles.socialButton, styles.appleButton, isAnyLoading && styles.buttonDisabled]}
                      onPress={handleAppleSignIn}
                      disabled={isAnyLoading}
                    >
                      {socialLoading === "apple" ? (
                        <ActivityIndicator color={colors.white} size="small" />
                      ) : (
                        <>
                          <Ionicons name="logo-apple" size={20} color={colors.white} />
                          <Text style={styles.appleButtonText}>Continue with Apple</Text>
                        </>
                      )}
                    </PressableScale>
                  )}

                  <PressableScale
                    style={[styles.socialButton, styles.googleButton, isAnyLoading && styles.buttonDisabled]}
                    onPress={handleGoogleSignIn}
                    disabled={isAnyLoading}
                  >
                    {socialLoading === "google" ? (
                      <ActivityIndicator color={colors.foreground} size="small" />
                    ) : (
                      <>
                        <Ionicons name="logo-google" size={18} color={colors.foreground} />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                      </>
                    )}
                  </PressableScale>
                </View>
              </FadeInUp>

              {/* Divider */}
              <FadeInUp delay={200}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or sign up with email</Text>
                  <View style={styles.dividerLine} />
                </View>
              </FadeInUp>

              <FadeInUp delay={250}>
                <View style={styles.card}>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Display Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Your name"
                      placeholderTextColor={colors.stone[400]}
                      value={displayName}
                      onChangeText={setDisplayName}
                      editable={!isAnyLoading}
                      autoCapitalize="words"
                      autoComplete="name"
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.stone[400]}
                      value={email}
                      onChangeText={setEmail}
                      editable={!isAnyLoading}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={colors.stone[400]}
                      value={password}
                      onChangeText={setPassword}
                      editable={!isAnyLoading}
                      secureTextEntry
                      autoComplete="password-new"
                    />
                    <Text style={styles.hint}>Minimum 8 characters</Text>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={colors.stone[400]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      editable={!isAnyLoading}
                      secureTextEntry
                      autoComplete="password-new"
                    />
                  </View>

                  {error ? <Text style={styles.error}>{error}</Text> : null}

                  <PressableScale
                    style={[styles.button, isAnyLoading && styles.buttonDisabled]}
                    onPress={handleSignUp}
                    disabled={isAnyLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Create Account</Text>
                    )}
                  </PressableScale>
                </View>
              </FadeInUp>

              <FadeInUp delay={400}>
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <Link href="/(auth)/login" asChild>
                    <PressableScale>
                      <Text style={styles.linkText}>Sign in</Text>
                    </PressableScale>
                  </Link>
                </View>
              </FadeInUp>
            </>
          )}
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
    marginBottom: spacing["2xl"],
    alignItems: "center",
  },
  logo: {
    width: 180,
    height: 48,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.stone[500],
  },

  // ── Social Auth ──────────────────────────
  socialSection: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.xl,
    minHeight: 50,
  },
  appleButton: {
    backgroundColor: "#000000",
  },
  appleButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.2,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.stone[200],
    ...shadows.soft,
  },
  googleButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.foreground,
    letterSpacing: 0.2,
  },

  // ── Divider ──────────────────────────────
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.stone[200],
  },
  dividerText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.stone[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
  },

  // ── Form ─────────────────────────────────
  card: {
    ...cardBase,
    padding: spacing["2xl"],
    marginBottom: spacing["2xl"],
  },
  fieldContainer: {
    marginBottom: spacing.lg,
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
  hint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.stone[400],
    marginTop: spacing.xs,
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
    marginTop: spacing.sm,
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
  // ── Email Confirmation ────────────────
  confirmCard: {
    ...cardBase,
    padding: spacing["2xl"],
    marginBottom: spacing["2xl"],
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.brand[50],
  },
  confirmIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  confirmTitle: {
    ...typography.headingLarge,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  confirmBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.stone[600],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  confirmEmail: {
    fontFamily: fonts.sansSemiBold,
    color: colors.foreground,
  },
  confirmHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.stone[500],
    textAlign: "center",
    lineHeight: 20,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontFamily: fonts.sans,
    color: colors.stone[500],
    fontSize: 14,
  },
  linkText: {
    fontFamily: fonts.sansBold,
    color: colors.brand[500],
    fontSize: 14,
  },
});
