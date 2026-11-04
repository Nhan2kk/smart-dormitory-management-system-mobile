import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../features/auth/AuthProvider";
import { SplashView } from "../../features/auth/SplashView";
import { NotificationsProvider } from "../../features/notifications/NotificationsProvider";
import { RealtimeProvider } from "../../features/realtime/RealtimeProvider";
import { useTheme } from "../../shared/theme";
import { SupportChatProvider } from "../../features/chat/SupportChatProvider";

/** Nhóm màn hình yêu cầu đăng nhập. */
export default function ProtectedLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  if (loading) return <SplashView />;
  if (!user) return <Redirect href="/welcome" />;
  return (
    <RealtimeProvider>
    <SupportChatProvider>
    <NotificationsProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="request/new" options={{ presentation: "transparentModal", animation: "fade", contentStyle: { backgroundColor: "transparent" } }} />
        <Stack.Screen name="debts/pay/[id]" options={{ presentation: "modal" }} />
      </Stack>
    </NotificationsProvider>
    </SupportChatProvider>
    </RealtimeProvider>
  );
}
