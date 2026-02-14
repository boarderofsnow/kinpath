import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link, type Href } from "expo-router";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>KinPath</Text>
      <Text style={styles.subtitle}>
        Evidence-based parenting resources, personalized to your family.
      </Text>

      <View style={styles.buttons}>
        <Link href={"/onboarding" as Href} asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </Link>

        <Link href={"/dashboard" as Href} asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fdf4f0",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#dc5a3a",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
  },
  buttons: {
    marginTop: 40,
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#dc5a3a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});
