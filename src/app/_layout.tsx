import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../features/auth/AuthProvider";
import { PreferencesProvider } from "../shared/preferences";
import { useTheme } from "../shared/theme";
import { ToastProvider, webScreenLayout } from "../shared/ui";

// Màn đăng nhập trượt vào; màn chào và nhóm màn hình đã đăng nhập chỉ hiện dần.
const rootScreenLayout = webScreenLayout((name) => (name === "login" ? "push" : "fade"));

/**
 * Bản web: thanh trình duyệt / vùng tai thỏ lấy màu nền trang và theme-color. Đồng bộ theo giao diện
 * đang chọn để không còn dải trắng phía trên (index.html đặt sẵn #FFFFFF).
 */
function useWebChromeColor(color: string) {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [color]);
}

function ThemedStack() {
  const { colors, isDark } = useTheme();
  useWebChromeColor(colors.background);
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenLayout={rootScreenLayout}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
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
