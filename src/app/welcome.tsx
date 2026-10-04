import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../features/auth/AuthProvider";

export default function WelcomeScreen() {
  const { user } = useAuth();
  if (user) return <Redirect href="/(tabs)" />;

  return (
    <ImageBackground
      source={require("../../assets/welcome-illustration-web.png")}
      resizeMode="cover"
      style={styles.background}
    >
      <StatusBar style="light" />
      <View style={styles.tint} />
      <SafeAreaView style={styles.page} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image
              source={require("../../assets/brand-logo.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Logo KTX DN"
            />
            <Text style={styles.brandTitle}>
              HỆ THỐNG QUẢN LÝ{"\n"}KÝ TÚC XÁ
            </Text>
          </View>
          <Text style={styles.description}>
            Quản lý phòng ở, hợp đồng, hóa đơn và các dịch vụ ký túc xá
          </Text>
        </View>

        <Pressable
          style={styles.loginButton}
          onPress={() => router.push("/login")}
          accessibilityRole="button"
          accessibilityLabel="Đăng nhập"
        >
          <Text style={styles.loginText}>Đăng nhập</Text>
          <Ionicons
            name="chevron-forward"
            size={21}
            color="#FFFFFF"
            style={styles.arrow}
          />
        </Pressable>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#398BD3" },
  tint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(4, 45, 87, 0.14)",
  },
  page: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24 },
  header: { marginTop: 30 },
  brand: { flexDirection: "row", alignItems: "center", gap: 13 },
  logo: { width: 52, height: 60 },
  brandTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
    textShadowColor: "rgba(0, 37, 78, 0.25)",
    textShadowRadius: 6,
  },
  description: {
    marginTop: 19,
    marginLeft: 65,
    maxWidth: 265,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
    textShadowColor: "rgba(0, 37, 78, 0.3)",
    textShadowRadius: 5,
  },
  loginButton: {
    minHeight: 54,
    marginBottom: 14,
    borderRadius: 15,
    backgroundColor: "#064684",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#05233E",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  loginText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  arrow: { position: "absolute", right: 18 },
});
