import { Stack } from "expo-router";
import { OnboardingProvider } from "../../lib/onboarding-context";
import { OnboardingProgress } from "../../components/OnboardingProgress";
import { useSegments } from "expo-router";

const SCREEN_ORDER = [
  "child-profile",
  "birth-preference",
  "feeding",
  "vaccines",
  "lifestyle",
  "topics",
  "paywall",
  "partner-invite",
] as const;

function ProgressHeader() {
  const segments = useSegments();
  const currentScreen = segments[segments.length - 1];
  const idx = SCREEN_ORDER.indexOf(currentScreen as any);
  if (idx < 0) return null;
  return <OnboardingProgress currentIndex={idx} totalSteps={SCREEN_ORDER.length} />;
}

export default function PostAuthLayout() {
  return (
    <OnboardingProvider>
      <ProgressHeader />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="child-profile" />
        <Stack.Screen name="birth-preference" />
        <Stack.Screen name="feeding" />
        <Stack.Screen name="vaccines" />
        <Stack.Screen name="lifestyle" />
        <Stack.Screen name="topics" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="partner-invite" />
      </Stack>
    </OnboardingProvider>
  );
}
