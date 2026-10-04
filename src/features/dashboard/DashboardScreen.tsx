import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthProvider";
import { colors } from "../../shared/theme";

const shortcuts = [
  {
    label: "Đăng ký KTX",
    icon: "clipboard-text-outline",
    color: "#A43BD5",
    bg: "#F5E8FB",
  },
  { label: "Nhận phòng", icon: "bed-outline", color: "#17B9A2", bg: "#E4F8F2" },
  { label: "Công nợ", icon: "cash-multiple", color: "#E9921E", bg: "#FFF1E2" },
  {
    label: "Hồ sơ lưu trú",
    icon: "file-document-outline",
    color: "#AD46CA",
    bg: "#F7ECFB",
  },
  {
    label: "Điện nước",
    icon: "lightning-bolt",
    color: "#F2A51B",
    bg: "#FFF5E1",
  },
  { label: "Yêu cầu hỗ trợ", icon: "headset", color: "#EC4D55", bg: "#FDEBED" },
] as const;

export default function DashboardScreen() {
  const { user } = useAuth();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Ionicons name="menu" size={26} color={colors.navy} />
          <View style={styles.bell}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.navy}
            />
            <View style={styles.dot} />
          </View>
        </View>
        <View style={styles.greeting}>
          <View>
            <Text style={styles.hello}>Xin chào,</Text>
            <Text style={styles.name}>{user?.fullName || "Sinh viên"}</Text>
            <Text style={styles.studentCode}>MSSV: {user?.username}</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="person" size={35} color="#3F8CC0" />
          </View>
        </View>
        <ImageBackground
          source={require("../../../assets/dormitory-hero.png")}
          style={styles.hero}
          imageStyle={{ borderRadius: 18 }}
        >
          <View style={styles.heroShade} />
          <View style={styles.heroFooter}>
            <View>
              <Text style={styles.heroTitle}>Khu A</Text>
              <Text style={styles.heroSubtitle}>Ký túc xá DN</Text>
            </View>
            <View style={styles.heroArrow}>
              <Ionicons name="chevron-forward" size={20} color={colors.navy} />
            </View>
          </View>
        </ImageBackground>
        <View style={styles.grid}>
          {shortcuts.map((item) => (
            <View key={item.label} style={styles.tile}>
              <View style={[styles.tileIcon, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={25}
                  color={item.color}
                />
              </View>
              <Text style={styles.tileLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Thông báo mới</Text>
          <Text style={styles.seeAll}>Xem tất cả</Text>
        </View>
        <View style={styles.notice}>
          <View style={styles.noticeIcon}>
            <Ionicons name="home" size={20} color="#EA313A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Thông báo đóng phí KTX</Text>
            <Text style={styles.noticeBody}>Đến hạn thanh toán tháng này</Text>
          </View>
          <Text style={styles.time}>Mới</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FCFF" },
  scroll: { paddingHorizontal: 19, paddingTop: 8, paddingBottom: 110 },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 3,
    marginBottom: 17,
  },
  bell: { padding: 4 },
  dot: {
    position: "absolute",
    width: 7,
    height: 7,
    backgroundColor: "#F0444F",
    borderRadius: 4,
    right: 3,
    top: 4,
  },
  greeting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
  },
  hello: { color: colors.navy, fontSize: 14 },
  name: { color: colors.navy, fontSize: 23, fontWeight: "800", marginTop: 2 },
  studentCode: { color: "#65758B", fontSize: 12, marginTop: 3 },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#D9F2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    height: 172,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(1,24,44,0.18)",
  },
  heroFooter: {
    height: 62,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,20,34,0.70)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTitle: { color: "white", fontSize: 17, fontWeight: "800" },
  heroSubtitle: { color: "white", fontSize: 11, marginTop: 2 },
  heroArrow: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 9,
    marginTop: 14,
  },
  tile: {
    width: "31.2%",
    height: 90,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#315078",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  tileIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tileLabel: {
    color: colors.navy,
    fontSize: 11,
    textAlign: "center",
    fontWeight: "600",
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.navy },
  seeAll: { color: "#1978AF", fontSize: 12 },
  notice: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noticeIcon: {
    backgroundColor: "#FFEFF0",
    width: 33,
    height: 33,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeTitle: { color: colors.navy, fontSize: 12, fontWeight: "700" },
  noticeBody: { color: "#77889B", fontSize: 11, marginTop: 3 },
  time: { color: "#8D9BAC", fontSize: 10 },
});
