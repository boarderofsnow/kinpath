import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import { colors } from "../lib/theme";

function RootLayoutContent() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inProtectedGroup = segments[0] === "(tabs)";

    if (session && inAuthGroup) {
      // Logged-in user on auth screen → send to dashboard
      router.replace("/(tabs)");
    } else if (!session && inProtectedGroup) {
      // Unauthenticated user on protected screen → send to welcome
      router.replace("/");
    }
    // Otherwise: let the user stay where they are
    // (welcome screen, auth screens, etc.)
  }, [session, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.brand[500]} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="resource/[slug]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    DMSerifDisplay_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.brand[500]} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
