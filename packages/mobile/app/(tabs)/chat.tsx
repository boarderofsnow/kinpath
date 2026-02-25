import React from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { MessageCircle } from "lucide-react-native";

const COLORS = {
  primary: "#10b89f",
  background: "#f0eeec",
  dark: "#1c1917",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.emptyStateIcon}>
          <MessageCircle size={48} color={COLORS.primary} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyStateText}>Ask KinPath AI</Text>
        <Text style={styles.emptyStateSubtext}>
          Get personalized guidance and answers to your parenting questions.
        </Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Coming Soon</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
