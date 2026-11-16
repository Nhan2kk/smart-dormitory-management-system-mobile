import { Tabs } from "expo-router";
import { FloatingTabBar } from "../../../features/home/FloatingTabBar";
import { useTheme } from "../../../shared/theme";

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      // Đổi tab: màn hình trượt nhẹ sang trái/phải theo hướng tab (chạy cả trên web).
      screenOptions={{ headerShown: false, animation: "shift", sceneStyle: { backgroundColor: colors.background } }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Trang chủ" }} />
      <Tabs.Screen name="utilities" options={{ title: "Điện nước" }} />
      <Tabs.Screen name="create" options={{ title: "Tạo mới" }} />
      <Tabs.Screen name="requests" options={{ title: "Yêu cầu" }} />
      <Tabs.Screen name="profile" options={{ title: "Cá nhân" }} />
    </Tabs>
  );
}
