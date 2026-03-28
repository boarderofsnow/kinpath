import { Stack } from "expo-router";

export default function PostAuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="paywall" />
      <Stack.Screen name="partner-invite" />
    </Stack>
  );
}
