import { Stack } from "expo-router";

/**
 * Root navigation layout (Expo Router file-based).
 *
 * Phase 0 minimum: tek stack, sade. Phase 1 MVP'de tab navigator
 * eklenir (Ana sayfa / Ara / Bookmark / Profil).
 */
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#a03b0f" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Tarifle" }} />
    </Stack>
  );
}
