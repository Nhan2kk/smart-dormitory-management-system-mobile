import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../features/auth/AuthProvider";
import { SplashView } from "../../features/auth/SplashView";
import { NotificationsProvider } from "../../features/notifications/NotificationsProvider";
import { WebPushSync } from "../../features/notifications/WebPushSync";
import { RealtimeProvider } from "../../features/realtime/RealtimeProvider";
import { useTheme } from "../../shared/theme";
import { SupportChatProvider } from "../../features/chat/SupportChatProvider";
import { webScreenLayout } from "../../shared/ui";

// Nhóm tab hiện dần (tránh trượt chồng với hiệu ứng của tầng gốc); màn hình con trượt từ phải.
const appScreenLayout = webScreenLayout((name) => (name === "(tabs)" ? "fade" : "push"));

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
      <WebPushSync />
      <Stack
        screenLayout={appScreenLayout}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="request/new" options={{ presentation: "transparentModal", animation: "fade", contentStyle: { backgroundColor: "transparent" } }} />
        <Stack.Screen name="debts/pay/[id]" options={{ presentation: "modal" }} />
      </Stack>
    </NotificationsProvider>
    </SupportChatProvider>
    </RealtimeProvider>
  );
}
