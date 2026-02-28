import { View, Text, Image, StyleSheet } from "react-native";
import { Link, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, typography, spacing, radii, shadows } from "../lib/theme";
import { FadeIn, FadeInUp, StaggerItem, PressableScale } from "../components/motion";

const FEATURES = [
  { icon: "sparkles-outline" as const, label: "Personalized guidance" },
  { icon: "book-outline" as const, label: "Evidence-based resources" },
  { icon: "chatbubble-outline" as const, label: "Find answers via chat" },
];

export default function WelcomeScreen() {
  return (
    <LinearGradient
      colors={[colors.brand[900], colors.brand[800], colors.sage[900]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {/* Decorative blur orbs */}
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />

      <View style={styles.container}>
        {/* Logo and Tagline */}
        <FadeIn delay={100}>
          <View style={styles.headerSection}>
            <Image
              source={require("../assets/kinpath-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>
              <Text style={styles.taglineWhite}>Parenting guidance that{"\n"}</Text>
              <Text style={styles.taglineAccent}>grows with your child</Text>
            </Text>
          </View>
        </FadeIn>

        {/* Feature Highlights */}
        <View style={styles.featuresSection}>
          {FEATURES.map((feature, index) => (
            <StaggerItem key={feature.label} index={index} staggerDelay={120}>
              <View style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Ionicons
                    name={feature.icon}
                    size={22}
                    color={colors.brand[300]}
                  />
                </View>
                <Text style={styles.featureText}>{feature.label}</Text>
              </View>
            </StaggerItem>
          ))}
        </View>

        {/* Buttons */}
        <FadeInUp delay={500}>
          <View style={styles.buttons}>
            <Link href={"/(auth)/register" as Href} asChild>
              <PressableScale style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </PressableScale>
            </Link>

            <Link href={"/(auth)/login" as Href} asChild>
              <PressableScale style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Sign In</Text>
              </PressableScale>
            </Link>
          </View>
        </FadeInUp>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing["2xl"],
  },
  // Decorative gradient orbs
  orbTopRight: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.brand[600],
    opacity: 0.15,
  },
  orbBottomLeft: {
    position: "absolute",
    bottom: 80,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.sage[600],
    opacity: 0.12,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: spacing["5xl"],
  },
  logo: {
    width: 200,
    height: 60,
    marginBottom: spacing.xl,
    tintColor: colors.white,
  },
  tagline: {
    textAlign: "center",
    lineHeight: 32,
  },
  taglineWhite: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.white,
  },
  taglineAccent: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.accent[400],
  },
  featuresSection: {
    width: "100%",
    marginBottom: spacing["5xl"],
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.brand[100],
    flex: 1,
  },
  buttons: {
    width: "100%",
    marginHorizontal: -spacing.md,
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.accent[500],
    borderRadius: radii.xl,
    paddingVertical: 18,
    paddingHorizontal: spacing["3xl"],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.white,
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: radii.xl,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  secondaryButtonText: {
    fontFamily: fonts.sansSemiBold,
    color: colors.white,
    fontSize: 16,
  },
});
