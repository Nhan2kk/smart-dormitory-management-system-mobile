import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../../features/auth/AuthProvider";

const icons = [
  "card-outline",
  "pulse-outline",
  "pie-chart-outline",
  "scan-outline",
  "grid-outline",
] as const;

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#07569B" />
      </View>
    );
  if (!user) return <Redirect href="/welcome" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.item,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#242A33",
        tabBarIconStyle: styles.icon,
      }}
    >
      {(["index", "activity", "statistics", "scan", "services"] as const).map(
        (name, index) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              title: [
                "Trang chủ",
                "Hoạt động",
                "Thống kê",
                "Quét mã",
                "Dịch vụ",
              ][index],
              tabBarIcon: ({ focused }) => (
                <View style={[styles.iconCircle, focused && styles.active]}>
                  <Ionicons
                    name={icons[index]}
                    size={23}
                    color={focused ? "#FFFFFF" : "#242A33"}
                  />
                </View>
              ),
            }}
          />
        ),
      )}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center" },
  bar: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 20,
    height: 62,
    borderRadius: 36,
    backgroundColor: "#F4F4F4",
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 15,
    paddingTop: 5,
  },
  item: { height: 52 },
  icon: { height: 46, width: 46 },
  iconCircle: {
    width: 47,
    height: 47,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  active: { backgroundColor: "#050505" },
});
