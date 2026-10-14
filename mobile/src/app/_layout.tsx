import { Stack, DefaultTheme, ThemeProvider } from "expo-router";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { TavernProvider, useTavern } from "@/features/tavern/live-store";
import { C } from "@/features/tavern/ui";
export default function RootLayout() {
  return (
    <TavernProvider>
      <AppNavigation />
    </TavernProvider>
  );
}

function AppNavigation() {
  const { ready, session } = useTavern();
  if (!ready) return <View style={{ flex: 1, justifyContent: "center", backgroundColor: C.parchment }}><ActivityIndicator color={C.wax} /></View>;
  return (
      <ThemeProvider
        value={{
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: C.parchment,
            card: C.paper,
            text: C.ink,
            primary: C.wax,
            border: C.line,
          },
        }}
      >
        <StatusBar barStyle="dark-content" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.parchment },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="account" options={{ animation: "fade" }} />
          <Stack.Screen name="auth/callback" options={{ animation: "fade" }} />
          <Stack.Protected guard={!!session}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="bounty/[id]" />
            <Stack.Screen name="create" />
            <Stack.Screen name="member" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="conversation" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
  );
}
