import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthProvider";
import { colors } from "../../shared/theme";

export function SecondaryScreen({
  title,
  icon,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const { user, signOut } = useAuth();
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons name={icon} size={32} color={colors.blue} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>Tính năng đang được phát triển.</Text>
        {title === "Dịch vụ" && (
          <>
            <Text style={styles.user}>
              {user?.fullName} · {user?.username}
            </Text>
            <Pressable style={styles.logout} onPress={signOut}>
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  icon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#E8F2FA",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 24, color: colors.navy, fontWeight: "800", marginTop: 18 },
  description: { color: colors.muted, marginTop: 8 },
  user: { color: colors.navy, marginTop: 24 },
  logout: {
    marginTop: 22,
    paddingHorizontal: 28,
    paddingVertical: 13,
    backgroundColor: colors.blue,
    borderRadius: 12,
  },
  logoutText: { color: "white", fontWeight: "700" },
});
