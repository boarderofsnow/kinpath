import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import { colors } from "../lib/theme";
import { configureRevenueCat } from "../lib/purchases";

let rcConfigured = false;

/** Map DB onboarding_step to the correct post-auth screen */
const STEP_SCREEN_MAP: Record<string, string> = {
  child: "/(post-auth)/child-profile",
  preferences: "/(post-auth)/birth-preference",
  paywall: "/(post-auth)/paywall",
  partner_invite: "/(post-auth)/partner-invite",
};

function RootLayoutContent() {
  const { session, isLoading, onboardingComplete, onboardingStep } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Listen for deep links returning from email confirmation
  useEffect(() => {
    function handleDeepLink(event: { url: string }) {
      try {
        const hashIndex = event.url.indexOf("#");
        if (hashIndex === -1) return;
        const params = new URLSearchParams(event.url.substring(hashIndex + 1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      } catch {
        // Silently ignore malformed deep links
      }
    }

    // App opened from killed state by deep link
    Linking.getInitialURL().then((url) => {
      if (url && url.includes("auth-callback")) handleDeepLink({ url });
    });

    // App was in background when deep link arrived
    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Wait for both session and profile to load
    if (isLoading || (session && onboardingStep === null)) return;

    const seg = segments as string[];
    const inAuthGroup = seg[0] === "(auth)";
    const inProtectedGroup = seg[0] === "(tabs)";
    const inPostAuthGroup = seg[0] === "(post-auth)";
    const onWelcomeScreen =
      seg.length === 0 || seg[0] === "index" || seg[0] === undefined;

    if (!session && (inProtectedGroup || inPostAuthGroup)) {
      // Unauthenticated user on protected screen → send to login.
      // Cannot use "/" because both app/index.tsx and app/(tabs)/index.tsx
      // map to that path — Expo Router resolves it to the tabs index.
      router.replace("/(auth)/login");
    } else if (session && (inAuthGroup || onWelcomeScreen)) {
      // Logged-in user on auth or welcome screen → check onboarding state
      if (onboardingStep && onboardingStep !== "complete") {
        // Resume onboarding from wherever the user left off
        const screen = STEP_SCREEN_MAP[onboardingStep] || "/(post-auth)/child-profile";
        router.replace(screen as any);
      } else {
        router.replace("/(tabs)");
      }
    } else if (session && inPostAuthGroup && onboardingComplete) {
      // User completed the post-auth flow — prevent going back
      router.replace("/(tabs)");
    }
    // Otherwise: let the user stay where they are
  }, [session, isLoading, onboardingComplete, onboardingStep, segments]);

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
      <Stack.Screen name="(post-auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="resource/[slug]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Configure RevenueCat once — must happen after native modules are ready.
    // In React Native 0.76+ (New Architecture), calling TurboModules synchronously 
    // during root render can cause fatal EXC_BAD_ACCESS Hermes crashes.
    if (!rcConfigured) {
      rcConfigured = true;
      configureRevenueCat();
    }
  }, []);

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
