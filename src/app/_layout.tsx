import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../features/auth/AuthProvider";
import { PreferencesProvider } from "../shared/preferences";
import { useTheme } from "../shared/theme";
import { ToastProvider } from "../shared/ui";

function ThemedStack() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="welcome" options={{ animation: "fade" }} />
        <Stack.Screen name="login" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <ToastProvider>
          <AuthProvider>
            <ThemedStack />
          </AuthProvider>
        </ToastProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
