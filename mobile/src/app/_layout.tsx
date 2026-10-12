import { Stack, DefaultTheme, ThemeProvider } from "expo-router";
import { StatusBar } from "react-native";
import { TavernProvider } from "@/features/tavern/store";
import { C } from "@/features/tavern/ui";
export default function RootLayout() {
  return (
    <TavernProvider>
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
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="account" options={{ animation: "fade" }} />
        </Stack>
      </ThemeProvider>
    </TavernProvider>
  );
}
