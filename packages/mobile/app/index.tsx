import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";
import { Link, type Href } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const COLORS = {
  primary: "#10b89f",
  background: "#f0eeec",
  darkText: "#1c1917",
  lightText: "#78716c",
  white: "#ffffff",
  border: "#d4cfc8",
};

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo and Tagline */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>KinPath</Text>
          <Text style={styles.tagline}>Your parenting companion</Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={24}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.featureText}>Personalized guidance</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <MaterialCommunityIcons
                name="book-outline"
                size={24}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.featureText}>Evidence-based resources</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <MaterialCommunityIcons
                name="chat-outline"
                size={24}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.featureText}>AI-powered chat</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Link href={"/(auth)/register" as Href} asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </Pressable>
          </Link>

          <Link href={"/(auth)/login" as Href} asChild>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.lightText,
    textAlign: "center",
    fontWeight: "500",
  },
  featuresSection: {
    width: "100%",
    marginBottom: 48,
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(16, 184, 159, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkText,
    flex: 1,
  },
  buttons: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
