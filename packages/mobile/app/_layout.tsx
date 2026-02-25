import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { ActivityIndicator, View } from "react-native";
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";

function RootLayoutContent() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (session && inAuthGroup) {
      // Logged in but on auth screen → go to main app
      router.replace("/(tabs)");
    } else if (!session && !inAuthGroup) {
      // Not logged in and not on auth screen → go to login
      router.replace("/(auth)/login");
    }
  }, [session, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f0eeec",
        }}
      >
        <ActivityIndicator size="large" color="#10b89f" />
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
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
