import { Tabs } from "expo-router";
import { FloatingTabBar } from "../../../features/home/FloatingTabBar";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: "Trang chủ" }} />
      <Tabs.Screen name="utilities" options={{ title: "Điện nước" }} />
      <Tabs.Screen name="create" options={{ title: "Tạo mới" }} />
      <Tabs.Screen name="requests" options={{ title: "Yêu cầu" }} />
      <Tabs.Screen name="profile" options={{ title: "Cá nhân" }} />
    </Tabs>
  );
}
