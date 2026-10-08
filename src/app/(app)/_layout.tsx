import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../features/auth/AuthProvider";
import { SplashView } from "../../features/auth/SplashView";
import { useTheme } from "../../shared/theme";

/** Nhóm màn hình yêu cầu đăng nhập. */
export default function ProtectedLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  if (loading) return <SplashView />;
  if (!user) return <Redirect href="/welcome" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="request/new" options={{ presentation: "transparentModal", animation: "fade", contentStyle: { backgroundColor: "transparent" } }} />
      <Stack.Screen name="debts/pay/[id]" options={{ presentation: "modal" }} />
    </Stack>
  );
}
